import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async submitReport(data: { imei: string, ip: string, location?: string, description?: string, userId?: string, trustWeight?: number }) {
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
        userId: data.userId,
        trustWeight: data.trustWeight || 1
      }
    });
  }
}
