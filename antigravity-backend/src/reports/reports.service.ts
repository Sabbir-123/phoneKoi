import { Injectable, BadRequestException, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { UsersService } from '../users/users.service';
import { SupabaseService } from '../auth/supabase.service';
import { DeviceStatus, RiskLevel } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly usersService: UsersService,
    private readonly supabaseService: SupabaseService,
  ) {}

  async submitReport(data: {
    imei: string;
    ip: string;
    location?: string;
    description?: string;
    contactNumber?: string;
    deviceName?: string;
    brand?: string;
    model?: string;
    reportType?: 'LOST' | 'STOLEN';
    lossDate?: string;
    policeGdNumber?: string;
    policeStation?: string;
    notificationPreferences?: string[];
    extractedFromGd?: boolean;
    aiExtractionConfidence?: number;
    userId?: string;
    email?: string;
    trustWeight?: number;
    gdImage?: string;
  }) {
    if (!/^\d{15}$/.test(data.imei)) {
      throw new BadRequestException('Invalid IMEI format. IMEI must be 15 digits.');
    }

    // 1. Rate Limiting Check (within last 24h)
    const recentReportsCount = await this.prisma.report.count({
      where: {
        reporterIp: data.ip,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    if (recentReportsCount >= 5) {
      throw new BadRequestException('Report submission limit reached for this IP address today.');
    }

    // 2. Fetch User Record & Check Quotas
    let userRecord: any = null;
    let finalUserId: string | null = null;
    const lookupEmail = data.email ? data.email.toLowerCase().trim() : '';

    if (lookupEmail) {
      userRecord = await this.prisma.user.findUnique({
        where: { email: lookupEmail },
      });
      if (!userRecord) {
        userRecord = await this.usersService.getUserProfile(lookupEmail);
      }
      if (userRecord) {
        finalUserId = userRecord.id;
      }
    }

    // Prevent duplicate active reports on the same IMEI
    const existingActiveReport = await this.prisma.report.findFirst({
      where: {
        imei: data.imei,
        status: { in: ['PENDING', 'APPROVED'] },
      },
    });

    if (existingActiveReport) {
      const isSameReporter =
        (finalUserId && existingActiveReport.userId === finalUserId) ||
        (lookupEmail && existingActiveReport.userEmail?.toLowerCase() === lookupEmail);

      if (isSameReporter) {
        throw new BadRequestException(
          'You have already submitted an active theft report for this device. You can track or manage its status in your dashboard.',
        );
      } else {
        throw new ConflictException(
          'This IMEI has already been reported as lost/stolen by another verified account. Dual ownership reports for the same device are prohibited. If you are the rightful owner, please file an ownership dispute or contact support.',
        );
      }
    }

    const isAdmin = userRecord && userRecord.role === 'ADMIN';

    if (userRecord && !isAdmin) {
      if (userRecord.reportsLeft !== undefined && userRecord.reportsLeft <= 0) {
        throw new BadRequestException(
          'You have reached your free device reporting limit. Please upgrade your plan or request a top-up in the quota management page.',
        );
      }
    }

    // 3. Normalize notification preferences
    let notificationPreferences: string[] = ['IN_APP', 'TELEGRAM', 'EMAIL', 'WHATSAPP', 'SMS'];
    if (Array.isArray(data.notificationPreferences)) {
      notificationPreferences = data.notificationPreferences.map((p: any) => String(p).toUpperCase());
    } else if (data.notificationPreferences && typeof data.notificationPreferences === 'object') {
      const prefs: string[] = [];
      const np = data.notificationPreferences as Record<string, any>;
      if (np.inApp) prefs.push('IN_APP');
      if (np.telegram) prefs.push('TELEGRAM');
      if (np.whatsapp) prefs.push('WHATSAPP');
      if (np.email) prefs.push('EMAIL');
      if (np.sms) prefs.push('SMS');
      notificationPreferences = prefs.length > 0 ? prefs : ['IN_APP', 'TELEGRAM', 'EMAIL'];
    }

    // 4. Secure File Storage: Upload base64 GD to Supabase Storage if provided
    let gdStoragePath: string | null = null;
    if (data.gdImage && data.gdImage.startsWith('data:')) {
      const parts = data.gdImage.split(',');
      if (parts.length > 1) {
        const mimeMatch = data.gdImage.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64/);
        const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        const ext = mime === 'application/pdf' ? 'pdf' : 'jpg';
        const buffer = Buffer.from(parts[1], 'base64');
        const path = `reports/${Date.now()}_${data.imei}.${ext}`;
        const uploaded = await this.supabaseService.uploadFile('gd-documents', path, buffer, mime);
        if (uploaded) {
          gdStoragePath = path;
        }
      }
    }

    // 5. Atomic persistence: Upsert device, create report, and decrement quota only on success
    const deviceStatus = data.extractedFromGd ? DeviceStatus.STOLEN : DeviceStatus.SUSPICIOUS;

    const savedReport = await this.prisma.$transaction(async (tx: any) => {
      // Upsert device record
      await tx.device.upsert({
        where: { imei: data.imei },
        update: {
          status: deviceStatus,
          riskScore: data.extractedFromGd ? 98 : 65,
          riskLevel: data.extractedFromGd ? RiskLevel.HIGH : RiskLevel.MEDIUM,
          brand: data.brand || (data.deviceName ? data.deviceName.split(' ')[0] : undefined),
          model: data.model || data.deviceName || undefined,
          deviceName: data.deviceName || undefined,
        },
        create: {
          imei: data.imei,
          status: deviceStatus,
          riskScore: data.extractedFromGd ? 98 : 65,
          riskLevel: data.extractedFromGd ? RiskLevel.HIGH : RiskLevel.MEDIUM,
          brand: data.brand || (data.deviceName ? data.deviceName.split(' ')[0] : undefined),
          model: data.model || data.deviceName || undefined,
          deviceName: data.deviceName || undefined,
        },
      });

      // Persist to PostgreSQL Report table
      const report = await tx.report.create({
        data: {
          imei: data.imei,
          reporterIp: data.ip,
          userId: finalUserId,
          userEmail: data.email || userRecord?.email || null,
          location: data.location || '',
          description: data.description || '',
          contactNumber: data.contactNumber || '',
          deviceName: data.deviceName || '',
          brand: data.brand || (data.deviceName ? data.deviceName.split(' ')[0] : 'Unknown Brand'),
          model: data.model || data.deviceName || 'Mobile Device',
          reportType: data.reportType || 'STOLEN',
          lossDate: data.lossDate ? new Date(data.lossDate) : new Date(),
          policeGdNumber: data.policeGdNumber || '',
          policeStation: data.policeStation || '',
          notificationPreferences,
          extractedFromGd: Boolean(data.extractedFromGd),
          aiExtractionConfidence: data.aiExtractionConfidence || 0.85,
          status: 'PENDING',
          trustWeight: data.trustWeight || (data.extractedFromGd ? 5 : 1),
          gdStoragePath,
        },
      });

      // ONLY decrement user quota once report is successfully persisted
      if (userRecord && !isAdmin) {
        if (userRecord.reportsLeft !== undefined && userRecord.reportsLeft > 0) {
          await tx.user.update({
            where: { id: userRecord.id },
            data: { reportsLeft: { decrement: 1 } },
          });
        }
      }

      return report;
    });

    return savedReport;
  }

  async extractInfoFromGd(base64Image: string) {
    if (!base64Image) {
      throw new BadRequestException('Image data is required');
    }
    return this.aiService.extractInfoFromGd(base64Image);
  }

  async getReports(email?: string) {
    if (email) {
      const cleanEmail = email.toLowerCase().trim();
      return await this.prisma.report.findMany({
        where: {
          OR: [
            { userEmail: cleanEmail },
            { user: { email: cleanEmail } },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return await this.prisma.report.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRecovered(reportId: string, userEmail: string, userId?: string) {
    const cleanEmail = userEmail ? userEmail.toLowerCase().trim() : '';
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Report record not found.');
    }

    const isOwner =
      (userId && report.userId === userId) ||
      (cleanEmail && report.userEmail?.toLowerCase() === cleanEmail);

    const userRecord = cleanEmail
      ? await this.prisma.user.findUnique({ where: { email: cleanEmail } })
      : null;
    const isAdmin = userRecord?.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You do not have permission to modify this report.');
    }

    const updatedReport = await this.prisma.report.update({
      where: { id: reportId },
      data: {
        status: 'RECOVERED',
      },
    });

    // Check if there are any other remaining active reports for this IMEI
    const remainingActiveReports = await this.prisma.report.count({
      where: {
        imei: report.imei,
        status: { in: ['PENDING', 'APPROVED'] },
      },
    });

    if (remainingActiveReports === 0) {
      await this.prisma.device.updateMany({
        where: { imei: report.imei },
        data: {
          status: DeviceStatus.CLEAN,
          riskScore: 0,
          riskLevel: RiskLevel.LOW,
        },
      });
    }

    return {
      success: true,
      message: 'Device has been successfully marked as recovered and the stolen alert flag has been cleared.',
      report: updatedReport,
    };
  }
}
