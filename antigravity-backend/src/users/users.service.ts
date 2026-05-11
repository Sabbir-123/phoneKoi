import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getUserInsights(userId: string) {
    // In a real scenario, we would filter by userId.
    // For this prototype, we'll fetch general system trends as "insights"
    // to simulate personalization without requiring full auth setup first.
    
    const recentSearches = await this.prisma.searchLog.findMany({
      take: 5,
      orderBy: { timestamp: 'desc' },
      select: { imei: true, location: true, timestamp: true }
    });

    const recentReports = await this.prisma.report.findMany({
      take: 3,
      orderBy: { date: 'desc' },
      select: { status: true, date: true }
    });

    return {
      userId,
      message: "Personalized insights generated",
      recentChecks: recentSearches,
      localRiskTrends: {
        trend: "Rising",
        reportsInArea: recentReports.length,
        advice: "Be extra cautious when buying devices in your current area this week."
      }
    };
  }
}
