import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AlertDispatcherService } from '../notifications/alert-dispatcher.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  private subRequestsCache: { data: any[]; expiresAt: number } | null = null;
  private deviceReportsCache: { data: any[]; expiresAt: number } | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly alertDispatcherService: AlertDispatcherService,
  ) {}

  invalidateCaches() {
    this.subRequestsCache = null;
    this.deviceReportsCache = null;
  }

  async getAllSubscriptionRequests() {
    try {
      const now = Date.now();
      if (this.subRequestsCache && this.subRequestsCache.expiresAt > now) {
        return this.subRequestsCache.data;
      }

      const data = await this.prisma.subscriptionRequest.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              email: true,
              displayName: true,
              plan: true,
            },
          },
        },
      });

      this.subRequestsCache = { data, expiresAt: now + 5000 };
      return data;
    } catch (e: any) {
      this.logger.error(`Error querying subscription requests from database: ${e?.message || e}`);
      throw e;
    }
  }

  async approveSubscriptionRequest(id: string) {
    const request = await this.prisma.subscriptionRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException(`Subscription request with ID ${id} not found`);
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException(`Subscription request is already ${request.status}`);
    }

    // Determine plan quotas
    let months = 1;
    let searches = 3;
    let reportQuota = 2; // ৳49/1 Month -> 2 mobile reports

    const planLower = request.planName.toLowerCase();
    if (planLower.includes('3 month')) {
      months = 3;
      searches = 15;
      reportQuota = 4; // ৳99/3 Months -> 4 mobile reports
    } else if (planLower.includes('6 month')) {
      months = 6;
      searches = 30;
      reportQuota = 10; // ৳259/6 Months -> 10 mobile reports
    } else if (planLower.includes('12 month') || planLower.includes('1 year')) {
      months = 12;
      searches = 99;
      reportQuota = 50; // ৳999/12 Months -> 50 mobile reports
    }

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + months);

    return await this.prisma.$transaction(async (tx) => {
      const updatedRequest = await tx.subscriptionRequest.update({
        where: { id },
        data: { status: 'APPROVED' },
      });

      if (request.userId) {
        await tx.user.update({
          where: { id: request.userId },
          data: {
            plan: request.planName,
            isPro: true,
            searchLimit: searches,
            searchesLeft: searches,
            reportLimit: reportQuota,
            reportsLeft: reportQuota,
            subscriptionExpiresAt: expiresAt,
          },
        });
      } else if (request.userEmail) {
        await tx.user.updateMany({
          where: { email: request.userEmail },
          data: {
            plan: request.planName,
            isPro: true,
            searchLimit: searches,
            searchesLeft: searches,
            reportLimit: reportQuota,
            reportsLeft: reportQuota,
            subscriptionExpiresAt: expiresAt,
          },
        });
      }

      this.invalidateCaches();
      return updatedRequest;
    });
  }

  async rejectSubscriptionRequest(id: string) {
    const request = await this.prisma.subscriptionRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException(`Subscription request with ID ${id} not found`);
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException(`Subscription request is already ${request.status}`);
    }

    this.invalidateCaches();
    return await this.prisma.subscriptionRequest.update({
      where: { id },
      data: { status: 'REJECTED' },
    });
  }

  async getAllDeviceReports() {
    try {
      const now = Date.now();
      if (this.deviceReportsCache && this.deviceReportsCache.expiresAt > now) {
        return this.deviceReportsCache.data;
      }

      const data = await this.prisma.report.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              email: true,
              displayName: true,
              phone: true,
            },
          },
        },
      });

      this.deviceReportsCache = { data, expiresAt: now + 5000 };
      return data;
    } catch (e: any) {
      this.logger.error(`Error querying device reports from database: ${e?.message || e}`);
      throw e;
    }
  }

  async approveDeviceReport(id: string) {
    const report = await this.prisma.report.findUnique({
      where: { id },
    });

    if (!report) {
      throw new NotFoundException(`Device report with ID ${id} not found`);
    }

    if (report.status === 'APPROVED') {
      throw new BadRequestException(`Report is already ${report.status}`);
    }

    return await this.prisma.$transaction(async (tx) => {
      const updatedReport = await tx.report.update({
        where: { id },
        data: { status: 'APPROVED' },
      });

      await tx.device.upsert({
        where: { imei: report.imei },
        create: {
          imei: report.imei,
          status: 'STOLEN',
          riskScore: 98,
          riskLevel: 'HIGH',
        },
        update: {
          status: 'STOLEN',
          riskScore: 98,
          riskLevel: 'HIGH',
        },
      });

      this.invalidateCaches();
      return updatedReport;
    });
  }

  async rejectDeviceReport(id: string) {
    const report = await this.prisma.report.findUnique({
      where: { id },
    });

    if (!report) {
      throw new NotFoundException(`Device report with ID ${id} not found`);
    }

    if (report.status === 'REJECTED') {
      throw new BadRequestException(`Report is already ${report.status}`);
    }

    return await this.prisma.$transaction(async (tx) => {
      const updatedReport = await tx.report.update({
        where: { id },
        data: { status: 'REJECTED' },
      });

      const otherApprovedReports = await tx.report.count({
        where: {
          imei: report.imei,
          status: 'APPROVED',
          id: { not: id },
        },
      });

      if (otherApprovedReports === 0) {
        await tx.device.updateMany({
          where: { imei: report.imei },
          data: {
            status: 'CLEAN',
            riskScore: 0,
            riskLevel: 'LOW',
          },
        });
      }

      this.invalidateCaches();
      return updatedReport;
    });
  }

  async getGatewaySettings() {
    return this.alertDispatcherService.getMaskedConfigForAdmin();
  }

  async updateGatewaySettings(body: any) {
    const existing = await this.alertDispatcherService.getGatewaysConfig();

    const merged = {
      telegram: {
        enabled: Boolean(body.telegram?.enabled),
        botToken: body.telegram?.botToken && !body.telegram.botToken.includes('...') ? body.telegram.botToken : existing.telegram.botToken,
        botUsername: body.telegram?.botUsername || existing.telegram.botUsername || 'PhoneKoiAlertBot',
        adminChatId: body.telegram?.adminChatId !== undefined ? body.telegram.adminChatId : existing.telegram.adminChatId,
      },
      email: {
        enabled: Boolean(body.email?.enabled),
        provider: body.email?.provider || existing.email.provider || 'RESEND',
        resendApiKey: body.email?.resendApiKey && !body.email.resendApiKey.includes('...') ? body.email.resendApiKey : existing.email.resendApiKey,
        fromEmail: body.email?.fromEmail || existing.email.fromEmail || 'PhoneKoi Alerts <alerts@phonekoi.com>',
      },
      whatsapp: {
        enabled: Boolean(body.whatsapp?.enabled),
        provider: body.whatsapp?.provider || existing.whatsapp.provider || 'ULTRAMSG',
        instanceId: body.whatsapp?.instanceId !== undefined ? body.whatsapp.instanceId : existing.whatsapp.instanceId,
        token: body.whatsapp?.token && !body.whatsapp.token.includes('...') ? body.whatsapp.token : existing.whatsapp.token,
        senderNumber: body.whatsapp?.senderNumber !== undefined ? body.whatsapp.senderNumber : existing.whatsapp.senderNumber,
      },
      sms: {
        enabled: Boolean(body.sms?.enabled),
        provider: body.sms?.provider || existing.sms.provider || 'GREENWEB',
        apiKey: body.sms?.apiKey && !body.sms.apiKey.includes('...') ? body.sms.apiKey : existing.sms.apiKey,
        senderId: body.sms?.senderId !== undefined ? body.sms.senderId : existing.sms.senderId,
        clientSecret: body.sms?.clientSecret && !body.sms.clientSecret.includes('...') ? body.sms.clientSecret : existing.sms.clientSecret,
      },
    };

    await this.alertDispatcherService.updateGatewaysConfig(merged);
    return this.alertDispatcherService.getMaskedConfigForAdmin();
  }

  async testGatewayChannel(channel: 'TELEGRAM' | 'EMAIL' | 'WHATSAPP' | 'SMS', recipient: string, configOverride?: any) {
    return this.alertDispatcherService.testChannel(channel, recipient, configOverride);
  }
}


