import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService
  ) {}

  async submitReport(data: { 
    imei: string, 
    ip: string, 
    location?: string, 
    description?: string, 
    contactNumber?: string,
    deviceName?: string,
    extractedFromGd?: boolean,
    aiExtractionConfidence?: number,
    userId?: string, 
    email?: string,
    trustWeight?: number,
    gdImage?: string
  }) {
    if (!/^\d{15}$/.test(data.imei)) {
      throw new BadRequestException('Invalid IMEI format');
    }

    // Check rate limit or duplicate by IP within last 24h
    const recentReports = await this.prisma.report.count({
      where: {
        reporterIp: data.ip,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    });

    if (recentReports > 5) {
      throw new BadRequestException('Rate limit exceeded for reports from this IP');
    }

    // Find user ID from email if provided
    let finalUserId = data.userId;
    let userRecord = null;
    if (data.email) {
      userRecord = await this.prisma.user.findUnique({
        where: { email: data.email }
      });
      if (userRecord) {
        finalUserId = userRecord.id;
      }
    }

    // STRICT PLAN CHECK: Basic/FREE users or users with 0 quota left cannot submit reports
    if (!userRecord || userRecord.plan !== 'PRO' || !userRecord.isPro || userRecord.reportsLeft <= 0) {
      throw new BadRequestException('Reporting is strictly restricted to premium accounts with active quotas. Please purchase a package.');
    }

    // Upsert the device first (so it exists)
    await this.prisma.device.upsert({
      where: { imei: data.imei },
      update: {},
      create: { imei: data.imei }
    });

    // Create the report and decrement user's reportsLeft quota in a transaction
    return this.prisma.$transaction(async (tx) => {
      const newReport = await tx.report.create({
        data: {
          imei: data.imei,
          reporterIp: data.ip,
          location: data.location,
          description: data.description,
          contactNumber: data.contactNumber,
          deviceName: data.deviceName,
          extractedFromGd: data.extractedFromGd || false,
          aiExtractionConfidence: data.aiExtractionConfidence,
          userId: finalUserId,
          trustWeight: data.trustWeight || 1,
          gdImage: data.gdImage
        }
      });

      await tx.user.update({
        where: { id: userRecord.id },
        data: {
          reportsLeft: {
            decrement: 1
          }
        }
      });

      return newReport;
    });
  }

  async extractInfoFromGd(base64Image: string) {
    if (!base64Image) {
      throw new BadRequestException('Image data is required');
    }
    return this.aiService.extractInfoFromGd(base64Image);
  }

  async getReports(email?: string) {
    if (email) {
      const user = await this.prisma.user.findUnique({
        where: { email }
      });
      if (user) {
        return this.prisma.report.findMany({
          where: { userId: user.id },
          orderBy: {
            createdAt: 'desc'
          }
        });
      }
      return [];
    }

    return this.prisma.report.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
  }
}
