import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchLogsService } from '../search-logs/search-logs.service';
import { SearchEventsService } from '../search-events/search-events.service';
import { DeviceStatus, RiskLevel } from '@prisma/client';
import { AiService } from '../ai/ai.service';

@Injectable()
export class ImeiService {
  private readonly logger = new Logger(ImeiService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly searchLogsService: SearchLogsService,
    private readonly searchEventsService: SearchEventsService,
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

  async checkImei(
    imei: string, 
    ip: string = '127.0.0.1', 
    language: 'english' | 'banglish' = 'english', 
    email?: string, 
    clientLocation?: string,
    lat?: number,
    lng?: number,
    accuracy?: number,
    locationSource?: 'BROWSER_GPS' | 'IP_APPROXIMATE' | 'UNAVAILABLE',
    currentUser?: { id: string; email: string; role: string }
  ) {
    if (!this.validateLuhn(imei)) {
      throw new BadRequestException('Invalid IMEI format or checksum failed');
    }

    // Query authoritative PostgreSQL database through Prisma
    let device: any = null;
    try {
      device = await this.prisma.device.findUnique({
        where: { imei },
        include: {
          reports: {
            where: { status: { in: ['APPROVED', 'PENDING'] } },
            include: { user: true },
            orderBy: { createdAt: 'desc' }
          }
        }
      });
    } catch (dbErr: any) {
      this.logger.error(`Database query failed for device ${imei}: ${dbErr?.message || dbErr}`);
      throw dbErr;
    }

    // Also check for any standalone reports matching this IMEI
    let activeReport: any = device?.reports?.find((r: any) => r.status === 'APPROVED') 
      || device?.reports?.[0] 
      || null;

    if (!activeReport) {
      try {
        activeReport = await this.prisma.report.findFirst({
          where: { imei, status: { in: ['APPROVED', 'PENDING'] } },
          include: { user: true },
          orderBy: { createdAt: 'desc' }
        });
      } catch (err: any) {
        this.logger.error(`Database query failed for reports with IMEI ${imei}: ${err?.message || err}`);
        throw err;
      }
    }

    // Check if device is recovered in police custody
    let recoveredRecord: any = null;
    try {
      recoveredRecord = await this.prisma.recoveredDevice.findFirst({
        where: {
          OR: [{ imei1: imei }, { imei2: imei }],
        },
        include: {
          drive: true,
        },
      });
    } catch (recErr: any) {
      this.logger.warn(`Could not check police recovered devices for ${imei}: ${recErr?.message}`);
    }

    const policeRecovery = recoveredRecord
      ? {
          isRecovered: true,
          driveId: recoveredRecord.driveId,
          driveTitle: recoveredRecord.drive.title,
          agency: recoveredRecord.drive.agency,
          policeStation: recoveredRecord.drive.policeStation,
          caseNumber: recoveredRecord.drive.caseNumber,
          recoveryDate: recoveredRecord.drive.recoveryDate,
          officerName: recoveredRecord.drive.officerName,
          officerContact: recoveredRecord.drive.officerContact,
          mediaContact: recoveredRecord.drive.mediaContact,
          sourceUrl: recoveredRecord.drive.sourceUrl,
          claimInstructions: recoveredRecord.drive.claimInstructions,
          status: recoveredRecord.status,
          brand: recoveredRecord.brand,
          model: recoveredRecord.model,
        }
      : null;

    const isStolen = (device && device.status === DeviceStatus.STOLEN) || (activeReport && activeReport.status === 'APPROVED');

    // Handle authenticated user quota deduction via database
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
        this.logger.warn(`User quota operation encountered an error: ${userErr?.message || userErr}`);
        throw userErr;
      }
    }

    // Trigger Search Event & Real-Time Owner Notification
    this.searchEventsService.recordSearchEvent({
      imei,
      ip,
      clientLocation,
      latitude: lat,
      longitude: lng,
      accuracy,
      locationSource
    }).catch((err: any) => this.logger.warn(`Search event recording warning: ${err?.message || err}`));

    // Log search event associated with user
    this.searchLogsService.logSearch(
      imei,
      ip,
      clientLocation,
      currentUser?.id,
      currentUser?.email
    ).catch((err: any) => this.logger.warn(`Search log error: ${err?.message || err}`));

    const maskedImei = imei.length === 15 ? `${imei.slice(0, 6)}*****${imei.slice(11)}` : `***********${imei.slice(-4)}`;

    if (!device && !activeReport) {
      // Check if device was found in police custody drive
      let explanation = language === 'banglish' 
        ? (policeRecovery 
            ? '🎉 Ei device-ti police uddhar koreche ebong police hefazote royeche!' 
            : 'Eti ekta clean device. Kono churi ba GD report paowa jayni.')
        : (policeRecovery 
            ? '🎉 FOUND IN POLICE CUSTODY! This device was recovered in a law enforcement operation.'
            : 'No theft reports, active police GD complaints, or suspicious patterns detected for this IMEI. Format is authentic and safe to proceed.');

      if (!policeRecovery) {
        try {
          explanation = await this.aiService.generateRiskExplanation(DeviceStatus.CLEAN, 0, language);
        } catch (aiErr: any) {
          this.logger.warn(`AI risk explanation fallback: ${aiErr?.message || aiErr}`);
        }
      }

      return {
        imei,
        maskedImei,
        risk_score: policeRecovery ? 15 : 0,
        risk_level: RiskLevel.LOW,
        status: DeviceStatus.CLEAN,
        explanation,
        advisory: policeRecovery
          ? 'This device is currently listed in official police custody. If you are the rightful owner, review the claim instructions and contact the investigating officer to retrieve your phone.'
          : 'No theft or loss reports currently registered for this IMEI. However, this does not guarantee the device is genuine, free of debt, or legally owned. Always verify the original physical invoice, box serial, and seller credentials.',
        ownerAlertDispatched: false,
        brand: policeRecovery?.brand || 'Mobile Device',
        model: policeRecovery?.model || 'Standard Model',
        deviceName: `${policeRecovery?.brand || ''} ${policeRecovery?.model || ''}`.trim() || 'Mobile Device',
        policeRecovery,
      };
    }

    const deviceStatus = isStolen ? DeviceStatus.STOLEN : (device?.status || DeviceStatus.CLEAN);
    const riskScore = isStolen ? (device?.riskScore || 98) : (device?.riskScore || 0);
    const riskLevel = isStolen ? RiskLevel.HIGH : (device?.riskLevel || RiskLevel.LOW);

    let explanation = 'Device status evaluated.';
    if (policeRecovery && isStolen) {
      explanation = language === 'banglish'
        ? '🎉 Shukhhobor! Apnar churi jaowa phone-ti police uddhar koreche! Firot pete nicher tothye jogajog korun.'
        : '🎉 GREAT NEWS! This reported stolen device has been recovered by Police and is currently in official custody.';
    } else {
      try {
        explanation = await this.aiService.generateRiskExplanation(deviceStatus, riskScore, language);
      } catch (aiErr: any) {
        this.logger.warn(`AI risk explanation fallback: ${aiErr?.message || aiErr}`);
      }
    }

    // Check if the current user is an admin or the legitimate owner of the report
    const isOwnerOrAdmin =
      currentUser &&
      (currentUser.role === 'ADMIN' ||
        (activeReport?.userEmail &&
          currentUser.email?.toLowerCase().trim() ===
            activeReport.userEmail.toLowerCase().trim()) ||
        (activeReport?.userId && currentUser.id === activeReport.userId));

    // Mask phone number for public users (prevent scraping & harassment)
    let displayContactNumber = activeReport?.contactNumber || null;
    if (!isOwnerOrAdmin && displayContactNumber) {
      displayContactNumber =
        displayContactNumber.length >= 7
          ? `${displayContactNumber.slice(0, 4)}****${displayContactNumber.slice(-3)}`
          : '***********';
    }

    // Mask Police GD number for public users
    let displayPoliceGd = activeReport?.policeGdNumber || null;
    if (!isOwnerOrAdmin && displayPoliceGd && displayPoliceGd.length > 4) {
      displayPoliceGd = `${displayPoliceGd.slice(0, 2)}****${displayPoliceGd.slice(-2)}`;
    }

    const reportType = activeReport?.reportType || (isStolen ? 'STOLEN' : 'CLEAN');

    const rawOwnerContact = activeReport?.contactNumber || activeReport?.user?.whatsapp || activeReport?.user?.phone || null;

    return {
      imei,
      maskedImei,
      risk_score: riskScore,
      risk_level: riskLevel,
      status: deviceStatus,
      reportType,
      explanation,
      contactNumber: displayContactNumber,
      ownerWhatsappNumber: isStolen ? rawOwnerContact : null,
      warningMessage: isStolen
        ? (policeRecovery
            ? 'NOTICE: This reported device was recovered in a police operation. See custody and claim details below.'
            : 'WARNING: This device has been reported lost or stolen. Do not purchase this phone until its ownership has been verified.')
        : undefined,
      ownerAlertDispatched: isStolen,
      brand: activeReport?.brand || activeReport?.deviceName?.split(' ')[0] || policeRecovery?.brand || 'Mobile Device',
      model: activeReport?.model || activeReport?.deviceName || policeRecovery?.model || 'Standard Model',
      deviceName: activeReport?.deviceName || `${policeRecovery?.brand || ''} ${policeRecovery?.model || ''}`.trim() || 'Reported Handset',
      lossDate: activeReport?.lossDate || activeReport?.date || null,
      policeGdNumber: displayPoliceGd || policeRecovery?.caseNumber || null,
      policeStation: activeReport?.policeStation || policeRecovery?.policeStation || null,
      allowContact: isStolen,
      safetyGuidance: isStolen
        ? (policeRecovery
            ? 'Official Court Claim Advice: Contact the designated investigating officer with your original purchase receipt/box and submit an application to the Metropolitan Magistrate Court for custody handover.'
            : 'Law Enforcement Advice: Do not confront the seller directly. Note down their phone number or shop location and immediately inform your local police station.')
        : undefined,
      policeRecovery,
    };
  }
}

