import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchLogsService } from '../search-logs/search-logs.service';
import { SearchEventsService } from '../search-events/search-events.service';
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
    private readonly searchEventsService: SearchEventsService,
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

  async checkImei(
    imei: string, 
    ip: string = '127.0.0.1', 
    language: 'english' | 'banglish' = 'english', 
    email?: string, 
    clientLocation?: string,
    lat?: number,
    lng?: number,
    accuracy?: number,
    locationSource?: 'BROWSER_GPS' | 'IP_APPROXIMATE' | 'UNAVAILABLE'
  ) {
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
    const approvedReport = localReports.find(r => r.imei === imei && (r.status === 'APPROVED' || r.status === 'PENDING'));

    const isStolenReport = approvedReport && (approvedReport.status === 'APPROVED' || approvedReport.status === 'PENDING');

    if (isStolenReport || (localDev && localDev.status === 'STOLEN')) {
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

    // Trigger Search Event & Real-Time Owner Notification (fire and forget / async)
    this.searchEventsService.recordSearchEvent({
      imei,
      ip,
      clientLocation,
      latitude: lat,
      longitude: lng,
      accuracy,
      locationSource
    }).catch(err => console.warn('Search event recording warning:', err?.message || err));

    // Also trigger legacy Search Log Event asynchronously
    this.searchLogsService.logSearch(imei, ip, clientLocation).catch(err => console.warn('Search log non-critical error:', err?.message || err));

    const maskedImei = imei.length === 15 ? `${imei.slice(0, 6)}*****${imei.slice(11)}` : `***********${imei.slice(-4)}`;

    if (!device) {
      // Return clean default state with strict advisory
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
        maskedImei,
        risk_score: 0,
        risk_level: RiskLevel.LOW,
        status: DeviceStatus.CLEAN,
        explanation,
        advisory: 'No theft or loss reports currently registered for this IMEI. However, this does not guarantee the device is genuine, free of debt, or legally owned. Always verify the original physical invoice, box serial, and seller credentials.',
        ownerAlertDispatched: false,
      };
    }

    let explanation = 'Device status evaluated.';
    try {
      explanation = await this.aiService.generateRiskExplanation(device.status, device.riskScore, language);
    } catch (aiErr: any) {
      console.warn('AI risk explanation fallback:', aiErr?.message || aiErr);
    }

    // Fetch verified owner details safely
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

    const isStolen = device.status === DeviceStatus.STOLEN;
    const reportType = approvedReport?.reportType || (isStolen ? 'STOLEN' : 'CLEAN');

    return {
      imei: device.imei,
      maskedImei,
      risk_score: device.riskScore,
      risk_level: device.riskLevel,
      status: device.status,
      reportType,
      explanation,
      contactNumber,
      warningMessage: isStolen
        ? 'WARNING: This device has been reported lost or stolen. Do not purchase this phone until its ownership has been verified.'
        : undefined,
      ownerAlertDispatched: isStolen,
      brand: approvedReport?.brand || approvedReport?.deviceName?.split(' ')[0] || 'Mobile Device',
      model: approvedReport?.model || approvedReport?.deviceName || 'Standard Model',
      deviceName: approvedReport?.deviceName || 'Reported Handset',
      lossDate: approvedReport?.lossDate || approvedReport?.date || null,
      policeGdNumber: approvedReport?.policeGdNumber || null,
      policeStation: approvedReport?.policeStation || null,
      allowContact: isStolen,
      safetyGuidance: isStolen
        ? 'Law Enforcement Advice: Do not confront the seller directly. Note down their phone number or shop location and immediately inform your local police station.'
        : undefined,
    };
  }
}
