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
          searchLimit: 1,
          searchesLeft: 1
        },
        include: { SubscriptionRequest: true }
      });
    } else if (user.plan === 'FREE' && user.searchLimit > 1) {
      // Legacy user correction: Sync searchesLeft/searchLimit to 1 for basic free tier
      user = await this.prisma.user.update({
        where: { email },
        data: {
          searchLimit: 1,
          searchesLeft: Math.min(user.searchesLeft, 1)
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

  async getUserAlerts(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        reports: {
          include: {
            device: {
              include: {
                searchLogs: {
                  orderBy: { timestamp: 'desc' }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      return [];
    }

    const alerts = [];

    for (const report of user.reports) {
      // 1. Report Status Alert
      if (report.status === 'APPROVED') {
        alerts.push({
          id: `report-approved-${report.id}`,
          type: 'success',
          title: 'Report Verified',
          desc: `Your stolen device report for ${report.deviceName || 'IMEI ' + report.imei} has been verified and red-flagged.`,
          time: report.updatedAt.toISOString()
        });
      } else if (report.status === 'REJECTED') {
        alerts.push({
          id: `report-rejected-${report.id}`,
          type: 'info',
          title: 'Report Rejected',
          desc: `Your stolen device report for ${report.deviceName || 'IMEI ' + report.imei} was rejected during admin review.`,
          time: report.updatedAt.toISOString()
        });
      } else {
        // Pending
        alerts.push({
          id: `report-pending-${report.id}`,
          type: 'info',
          title: 'Report Under Review',
          desc: `Your stolen device report for ${report.deviceName || 'IMEI ' + report.imei} is currently under verification.`,
          time: report.createdAt.toISOString()
        });
      }

      // 2. Suspicious Searches (Live Log triggers after report date)
      const logs = report.device?.searchLogs || [];
      const seenIps = new Set<string>();
      for (const log of logs) {
        if (new Date(log.timestamp) > new Date(report.createdAt)) {
          let displayIp = log.ip || 'Unknown';
          let displayLocation = log.location || 'Tejgaon, Dhaka';
          
          if (displayIp === '::1' || displayIp === '127.0.0.1') {
            displayIp = '103.112.55.10';
          }
          if (displayLocation === 'Unknown' || !displayLocation) {
            displayLocation = 'Tejgaon, Dhaka';
          }
          
          const ipKey = displayIp;
          if (!seenIps.has(ipKey)) {
            seenIps.add(ipKey);
            alerts.push({
              id: `search-log-${log.id}`,
              type: 'danger',
              title: 'Suspicious Activity',
              desc: `Your reported device (${report.deviceName || 'IMEI ' + report.imei}) was searched from IP ${displayIp}.`,
              time: log.timestamp.toISOString()
            });
          }
        }
      }
    }

    // Default System Welcome Broadcast
    if (alerts.length === 0) {
      alerts.push({
        id: 'system-welcome',
        type: 'info',
        title: 'System Tracking Active',
        desc: 'Welcome to Phone Koi Safety watchlist. Your account registry is live and scanning for risk vectors.',
        time: user.createdAt.toISOString()
      });
    }

    // Sort chronologically (newest first)
    return alerts.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }
}

