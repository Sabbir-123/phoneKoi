import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchLogsService } from '../search-logs/search-logs.service';
import { DeviceStatus, RiskLevel } from '@prisma/client';
import { AiService } from '../ai/ai.service';

@Injectable()
export class ImeiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly searchLogsService: SearchLogsService,
    private readonly aiService: AiService
  ) {}

  validateLuhn(imei: string): boolean {
    if (!/^\d{15}$/.test(imei)) return false;
    let sum = 0;
    for (let i = 14; i >= 0; i--) {
      let digit = parseInt(imei.charAt(i), 10);
      if (i % 2 !== 0) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
    }
    return sum % 10 === 0;
  }

  async checkImei(imei: string, ip: string = '127.0.0.1', language: 'english' | 'banglish' = 'english', email?: string) {
    if (!this.validateLuhn(imei)) {
      throw new BadRequestException('Invalid IMEI format or checksum failed');
    }

    if (email) {
      let user = await this.prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await this.prisma.user.create({
          data: {
            email,
            plan: 'FREE',
            searchLimit: 3,
            searchesLeft: 3
          }
        });
      }

      if (user.searchesLeft <= 0) {
        throw new BadRequestException('QUOTA_LIMIT_EXCEEDED: You have used up your search limit. Please upgrade your subscription plan.');
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: { searchesLeft: user.searchesLeft - 1 }
      });
    }

    // Trigger Search Log Event asynchronously (fire and forget for now, normally use a queue)
    this.searchLogsService.logSearch(imei, ip).catch(err => console.error('Search log error:', err));

    // Attempt to find the device
    let device = await this.prisma.device.findUnique({
      where: { imei },
      include: {
        reports: {
          select: { status: true, trustWeight: true, date: true }
        }
      }
    });

    if (!device) {
      // Return a clean default state if not found
      const explanation = await this.aiService.generateRiskExplanation(DeviceStatus.CLEAN, 0, language);
      return {
        imei,
        risk_score: 0,
        risk_level: RiskLevel.LOW,
        status: DeviceStatus.CLEAN,
        explanation,
      };
    }

    const explanation = await this.aiService.generateRiskExplanation(device.status, device.riskScore, language);

    return {
      imei: device.imei,
      risk_score: device.riskScore,
      risk_level: device.riskLevel,
      status: device.status,
      explanation,
    };
  }
}
