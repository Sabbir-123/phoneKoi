import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      // We use gemini-2.5-flash as the active multimodal model
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    } else {
      this.logger.warn('GEMINI_API_KEY is missing. AI explanations will be disabled or mocked.');
    }
  }

  async generateRiskExplanation(status: string, riskScore: number, language: 'english' | 'banglish' = 'english'): Promise<string> {
    if (!this.model) {
      return this.getMockExplanation(status, language);
    }

    const prompt = `
You are Phone Koi AI, an assistant for a mobile device safety platform.
You explain device safety results to users.

Language Mode: ${language}

Rules:
- If Language Mode = "banglish":
  → Respond in Banglish (Bangla + English mix)
  → Friendly, casual tone
- If Language Mode = "english":
  → Respond in clear, simple English
  → Professional but easy to understand

General Rules:
- Keep responses short (1–2 lines max)
- Never say "confirmed stolen"
- Always express risk as probability
- Give clear actionable advice

Context:
The system already evaluated the device.
STATUS: ${status}
RISK SCORE: ${riskScore}/100

Generate the explanation based on the rules and context.
    `.trim();

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      this.logger.error('Failed to generate AI explanation', error);
      return this.getMockExplanation(status, language);
    }
  }

  async extractInfoFromGd(base64Image: string): Promise<{
    imei?: string;
    deviceName?: string;
    description?: string;
    incidentDate?: string;
    policeStation?: string;
    confidence: number;
  }> {
    if (!this.model) {
      throw new Error('AI Service not initialized');
    }

    const prompt = `
You are a highly accurate OCR and information extraction system for Phone Koi.
Analyze this Police GD (General Diary) copy and extract the following information in JSON format:

1. imei: The 15-digit IMEI number of the stolen/lost device.
2. deviceName: The brand and model of the device (e.g., iPhone 15 Pro Max, Techno Spark 20 Pro+).
3. description: A brief summary of the incident. If multiple devices are reported lost/stolen, describe ALL of them in detail here.
4. incidentDate: The date of the incident mentioned in the document.
5. policeStation: The name of the police station where the GD was filed.
6. confidence: A number between 0 and 1 representing your confidence in this extraction.

CRITICAL Rules for IMEI & Text Extraction:
- The document is in Bangla, English, or a mix of both. Parse both languages carefully.
- Convert all Bengali numerals (০=0, ১=1, ২=2, ৩=3, ৪=4, ৫=5, ৬=6, ৭=7, ৮=8, ৯=9) to standard English numerals.
- Strip away serial prefixes and index notations. For example, "১.৩৫০৬৬১৪..." or "1.3506614..." represents "Serial 1" followed by the IMEI starting with "35". Separate the serial number (1 or 2) from the actual IMEI.
- The final extracted IMEI must be a clean numeric string of exactly 15 digits.
- If the IMEI written in the document is 14 digits (because the typist omitted the final check digit), calculate the 15th Luhn check digit or append a zero/valid digit to ensure it forms a valid 15-digit IMEI.
- If multiple devices are reported in the document:
  - Populate the main "imei" and "deviceName" fields with the details of the FIRST device.
  - In the "description" field, provide a comprehensive explanation mentioning both devices, their respective model names, and their IMEIs, so both devices are accounted for.

ONLY return a valid JSON object, no markdown wrapper or extra text.
    `.trim();

    try {
      const result = await this.model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Image.split(',')[1] || base64Image,
            mimeType: 'image/jpeg',
          },
        },
      ]);
      
      const response = await result.response;
      const text = response.text().trim();
      
      // Clean the response if it contains markdown code blocks
      const jsonStr = text.replace(/```json\n?|\n?```/g, '').replace(/```/g, '').trim();
      const data = JSON.parse(jsonStr);

      return {
        imei: data.imei ? String(data.imei).replace(/\D/g, '').slice(0, 15) : undefined,
        deviceName: data.deviceName || undefined,
        description: data.description || undefined,
        incidentDate: data.incidentDate || undefined,
        policeStation: data.policeStation || undefined,
        confidence: data.confidence || 0.5,
      };
    } catch (error) {
      this.logger.error('Failed to extract info from GD', error);
      return {
        imei: undefined,
        deviceName: undefined,
        description: undefined,
        confidence: 0,
      };
    }
  }

  async extractPoliceRecoveryData(content: { text?: string; base64File?: string; mimeType?: string }): Promise<{
    title: string;
    agency: string;
    policeStation?: string;
    caseNumber?: string;
    officerName?: string;
    officerContact?: string;
    mediaContact?: string;
    claimInstructions?: string;
    driveDate?: string;
    devices: Array<{
      brand?: string;
      model?: string;
      imei1?: string;
      imei2?: string;
      serialNumber?: string;
      rawText?: string;
    }>;
  }> {
    if (!this.model) {
      throw new Error('AI Service (Gemini) is not initialized');
    }

    const systemPrompt = `
You are an expert OCR and Police Evidence Data Extraction AI for Bangladesh Law Enforcement.
Analyze the provided Bangladesh Police press release / recovery drive notice and extract structured information.

Instructions:
1. Extract metadata:
   - "title": Clean Bangla/English title summarizing the drive (e.g. "ডিবি সাইবার কর্তৃক উদ্ধারকৃত ১১৭টি মোবাইল ফোন")
   - "agency": e.g. "ডিবি সাইবার (ডিএমপি)" or "ঢাকা মেট্রোপলিটন পুলিশ (DMP)" or "র‌্যাব" or "সিআইডি"
   - "policeStation": Police station / Thana name (e.g. "শাহবাগ থানা" or "Shahbag Police Station")
   - "caseNumber": GD number, FIR number, or case number (e.g. "শাহবাগ থানার জিডি নং- ৪৭৪")
   - "officerName": Name and rank of the investigating officer (e.g. "এসআই মোঃ মঞ্জিল সিদ্দিকী")
   - "officerContact": Contact phone number(s) of the officer (e.g. "01676-271529")
   - "mediaContact": DMP media or public relations number if mentioned
   - "claimInstructions": Summary of court/magistrate release prayer instructions for victims to get their phone back
   - "driveDate": Date of recovery or publication if mentioned

2. Extract EVERY SINGLE recovered mobile device into the "devices" array:
   - Convert all Bengali numbers (০, ১, ২, ৩, ৪, ৫, ৬, ৭, ৮, ৯) to standard English digits (0-9).
   - "brand": Brand name (e.g. "Samsung", "Apple", "Xiaomi", "Vivo", "Oppo", "Nothing", "Realme", "Tecno", "Infinix", "Walton", etc.)
   - "model": Model name (e.g. "Galaxy A52", "iPhone 13 Pro Max", "Redmi Note 11", etc.). If not explicitly separated from brand, extract brand and model appropriately.
   - "imei1": Clean 14-16 digit numeric string for IMEI 1. Remove non-numeric characters.
   - "imei2": Clean 14-16 digit numeric string for IMEI 2 (or null if not present). Remove non-numeric characters.
   - "serialNumber": Serial number if mentioned (optional).
   - "rawText": The original single-line text for this device from the post.

CRITICAL: Extract ALL devices without omitting any. If there are 100+ devices, extract all of them into the "devices" array.
Return ONLY a valid JSON object matching the requested schema, without markdown formatting or codeblocks.
    `.trim();

    try {
      const parts: any[] = [systemPrompt];

      if (content.base64File && content.mimeType) {
        parts.push({
          inlineData: {
            data: content.base64File.split(',')[1] || content.base64File,
            mimeType: content.mimeType,
          },
        });
      }

      if (content.text) {
        parts.push(`\n\n--- DOCUMENT CONTENT ---\n${content.text}`);
      }

      const result = await this.model.generateContent(parts);
      const response = await result.response;
      const text = response.text().trim();

      const jsonStr = text.replace(/```json\n?|\n?```/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(jsonStr);

      const cleanNum = (str?: string) => {
        if (!str) return undefined;
        // convert bangla numerals to english digits
        const banglaToEng: Record<string, string> = {
          '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
          '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
        };
        const converted = String(str).replace(/[০-৯]/g, (d) => banglaToEng[d] || d);
        return converted.replace(/\D/g, '');
      };

      const devices = (parsed.devices || []).map((d: any) => ({
        brand: d.brand ? String(d.brand).trim() : undefined,
        model: d.model ? String(d.model).trim() : undefined,
        imei1: cleanNum(d.imei1),
        imei2: cleanNum(d.imei2),
        serialNumber: d.serialNumber ? String(d.serialNumber).trim() : undefined,
        rawText: d.rawText ? String(d.rawText).trim() : undefined,
      })).filter((d: any) => d.imei1 || d.imei2 || d.brand);

      return {
        title: parsed.title || 'পুলিশ কর্তৃক উদ্ধারকৃত মোবাইল ফোন',
        agency: parsed.agency || 'বাংলাদেশ পুলিশ',
        policeStation: parsed.policeStation || undefined,
        caseNumber: parsed.caseNumber || undefined,
        officerName: parsed.officerName || undefined,
        officerContact: parsed.officerContact || undefined,
        mediaContact: parsed.mediaContact || undefined,
        claimInstructions: parsed.claimInstructions || undefined,
        driveDate: parsed.driveDate || undefined,
        devices,
      };
    } catch (error) {
      this.logger.error('Failed to extract police recovery data with AI', error);
      throw error;
    }
  }

  private getMockExplanation(status: string, language: 'english' | 'banglish'): string {
    if (language === 'banglish') {
      if (status === 'CLEAN') return 'Safe mone hocche 👍 kinte paro';
      if (status === 'SUSPICIOUS') return 'Ektu risky lagche, careful thako';
      return 'Bhai eta churi hoar somvabona beshi, kinar age bhabia niyo.';
    }
    
    // English defaults
    if (status === 'CLEAN') return 'This looks safe 👍 you can proceed';
    if (status === 'SUSPICIOUS') return 'This device shows suspicious activity, proceed with caution';
    return 'High probability this device is stolen. Do not purchase.';
  }
}
