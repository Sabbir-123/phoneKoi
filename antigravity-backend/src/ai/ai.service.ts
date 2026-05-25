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
