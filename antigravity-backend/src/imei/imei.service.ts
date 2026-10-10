import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchLogsService } from '../search-logs/search-logs.service';
import { DeviceStatus, RiskLevel } from '@prisma/client';
import { AiService } from '../ai/ai.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ImeiService {
  private dataDir = path.join(process.cwd(), 'data');
  private devicesFile = path.join(process.cwd(), 'data', 'devices.json');
  private reportsFile = path.join(process.cwd(), 'data', 'reports.json');

  constructor(
    private readonly prisma: PrismaService,
    private readonly searchLogsService: SearchLogsService,
    private readonly aiService: AiService
  ) {}

  private getLocalDevices(): any[] {
    try {
      if (fs.existsSync(this.devicesFile)) {
        return JSON.parse(fs.readFileSync(this.devicesFile, 'utf-8')) || [];
      }
    } catch {}
    return [];
  }

  private getLocalReports(): any[] {
    try {
      if (fs.existsSync(this.reportsFile)) {
        return JSON.parse(fs.readFileSync(this.reportsFile, 'utf-8')) || [];
      }
    } catch {}
    return [];
  }

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

  async checkImei(imei: string, ip: string = '127.0.0.1', language: 'english' | 'banglish' = 'english', email?: string, clientLocation?: string) {
    // Attempt to find the device from database with fallback
    let device: any = null;
    try {
      device = await this.prisma.device.findUnique({
        where: { imei },
        include: {
          reports: {
            select: { status: true, trustWeight: true, date: true }
          }
        }
      });
    } catch (dbErr: any) {
      console.warn('Database query failed for device check, falling back to algorithmic evaluation:', dbErr?.message || dbErr);
    }

    // Check local fallback store
    const localDevices = this.getLocalDevices();
    const localReports = this.getLocalReports();
    const localDev = localDevices.find(d => d.imei === imei);
    const approvedReport = localReports.find(r => r.imei === imei && r.status === 'APPROVED');

    if (approvedReport || (localDev && localDev.status === 'STOLEN')) {
      device = {
        imei,
        status: DeviceStatus.STOLEN,
        riskScore: localDev?.riskScore || 98,
        riskLevel: localDev?.riskLevel || RiskLevel.HIGH,
        reports: [{ status: 'APPROVED', trustWeight: 5, date: approvedReport?.date || new Date() }]
      };
    } else if (!device && localDev) {
      device = {
        imei,
        status: localDev.status,
        riskScore: localDev.riskScore,
        riskLevel: localDev.riskLevel,
        reports: []
      };
    }

    if (!device && !this.validateLuhn(imei)) {
      throw new BadRequestException('Invalid IMEI format or checksum failed');
    }

    if (email) {
      try {
        let user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
          const isPromoActive = new Date() <= new Date('2027-01-31T23:59:59.999Z');
          user = await this.prisma.user.create({
            data: {
              email,
              plan: isPromoActive ? '6 Months Pro' : 'FREE',
              isPro: isPromoActive,
              searchLimit: isPromoActive ? 30 : 1,
              searchesLeft: isPromoActive ? 30 : 1,
              reportLimit: isPromoActive ? 10 : 0,
              reportsLeft: isPromoActive ? 10 : 0,
              subscriptionExpiresAt: isPromoActive ? new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) : null
            }
          });
        }

        if (user && user.searchesLeft <= 0) {
          throw new BadRequestException('QUOTA_LIMIT_EXCEEDED: You have used up your search limit. Please upgrade your subscription plan.');
        }

        if (user) {
          await this.prisma.user.update({
            where: { id: user.id },
            data: { searchesLeft: user.searchesLeft - 1 }
          });
        }
      } catch (userErr: any) {
        if (userErr instanceof BadRequestException) {
          throw userErr;
        }
        console.warn('User query/quota warning, proceeding with search:', userErr?.message || userErr);
      }
    }

    // Trigger Search Log Event asynchronously (fire and forget)
    this.searchLogsService.logSearch(imei, ip, clientLocation).catch(err => console.warn('Search log non-critical error:', err?.message || err));

    if (!device) {
      // Return a clean default state if not found
      let explanation = language === 'banglish' 
        ? 'Eti ekta clean device. Kono churi ba GD report paowa jayni.' 
        : 'No theft reports, active police GD complaints, or suspicious patterns detected for this IMEI. Format is authentic and safe to proceed.';
      try {
        explanation = await this.aiService.generateRiskExplanation(DeviceStatus.CLEAN, 0, language);
      } catch (aiErr: any) {
        console.warn('AI risk explanation fallback:', aiErr?.message || aiErr);
      }

      return {
        imei,
        risk_score: 0,
        risk_level: RiskLevel.LOW,
        status: DeviceStatus.CLEAN,
        explanation,
      };
    }

    let explanation = 'Device status evaluated.';
    try {
      explanation = await this.aiService.generateRiskExplanation(device.status, device.riskScore, language);
    } catch (aiErr: any) {
      console.warn('AI risk explanation fallback:', aiErr?.message || aiErr);
    }

    // Fetch the verified owner's contact number if the device is reported stolen
    let contactNumber: string | null = null;
    if (device.status === DeviceStatus.STOLEN) {
      try {
        const approvedRep = await this.prisma.report.findFirst({
          where: { imei: device.imei, status: 'APPROVED' },
          select: { contactNumber: true }
        });
        contactNumber = approvedRep?.contactNumber || null;
      } catch (repErr: any) {
        console.warn('Could not query approved report contact from DB:', repErr?.message || repErr);
      }

      if (!contactNumber && approvedReport) {
        contactNumber = approvedReport.contactNumber || null;
      }
    }

    return {
      imei: device.imei,
      risk_score: device.riskScore,
      risk_level: device.riskLevel,
      status: device.status,
      explanation,
      contactNumber,
    };
  }
}
