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
      // We use a fast, cost-effective model like gemini-1.5-flash for real-time explanations
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
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
