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
    trustWeight?: number 
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
    if (data.email) {
      const user = await this.prisma.user.findUnique({
        where: { email: data.email }
      });
      if (user) {
        finalUserId = user.id;
      }
    }

    // Upsert the device first (so it exists)
    await this.prisma.device.upsert({
      where: { imei: data.imei },
      update: {},
      create: { imei: data.imei }
    });

    // Create the report
    return this.prisma.report.create({
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
        trustWeight: data.trustWeight || 1
      }
    });
  }

  async extractInfoFromGd(base64Image: string) {
    if (!base64Image) {
      throw new BadRequestException('Image data is required');
    }
    return this.aiService.extractInfoFromGd(base64Image);
  }

  async getAllReports() {
    return this.prisma.report.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
  }
}
