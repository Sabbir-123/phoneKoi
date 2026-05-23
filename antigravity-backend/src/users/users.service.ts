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

  async getUserProfile(email: string) {
    let user = await this.prisma.user.findUnique({
      where: { email },
      include: { SubscriptionRequest: true }
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          role: email === 'ahmedsabbir2013@gmail.com' ? 'ADMIN' : 'USER',
          plan: 'FREE',
          searchLimit: 3,
          searchesLeft: 3
        },
        include: { SubscriptionRequest: true }
      });
    }

    return user;
  }

  async createSubscriptionRequest(email: string, dto: { planName: string, price: number, trxCode: string, bkashLastFour: string }) {
    // Ensure user exists
    const user = await this.getUserProfile(email);

    return this.prisma.subscriptionRequest.create({
      data: {
        userId: user.id,
        userEmail: email,
        planName: dto.planName,
        price: Number(dto.price),
        trxCode: dto.trxCode,
        bkashLastFour: dto.bkashLastFour,
        status: 'PENDING'
      }
    });
  }
}
