import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../auth/supabase.service';
import { AlertDispatcherService } from '../notifications/alert-dispatcher.service';
import { PLAN_PRICING_CATALOG } from './dto/subscription-request.dto';

export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('880')) {
    cleaned = cleaned.substring(2);
  }
  return cleaned;
}

@Injectable()
export class UsersService {
  private readonly profileCache = new Map<string, { profile: any; expiresAt: number }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseService: SupabaseService,
    private readonly alertDispatcher: AlertDispatcherService,
  ) {}

  invalidateProfileCache(email?: string) {
    if (email) {
      this.profileCache.delete(email.toLowerCase().trim());
    } else {
      this.profileCache.clear();
    }
  }

  async checkPhoneAvailability(phone: string, email?: string) {
    const normalized = normalizePhoneNumber(phone);
    if (!normalized || normalized.length < 10) {
      return { available: false, message: 'Invalid phone number format' };
    }

    const currentEmail = email?.toLowerCase().trim();
    const existing = await this.prisma.user.findFirst({
      where: {
        normalizedPhone: normalized,
        NOT: currentEmail ? { email: currentEmail } : undefined,
      },
    });

    if (existing) {
      return {
        available: false,
        message: 'Duplicate number: another user has already registered this phone number. Please use a different number.',
      };
    }

    return { available: true, message: 'Phone number is available' };
  }

  async updateUserProfile(
    email: string,
    dto: { phone: string; whatsapp?: string; address?: string; displayName?: string; avatar?: string; telegramChatId?: string },
  ) {
    if (!email) {
      throw new BadRequestException('Email is required');
    }
    const cleanEmail = email.toLowerCase().trim();

    if (!dto.displayName || !dto.displayName.trim()) {
      throw new BadRequestException('Full Name is mandatory to complete your profile.');
    }
    if (!dto.avatar || !dto.avatar.trim()) {
      throw new BadRequestException('Profile picture is mandatory to complete your profile.');
    }
    if (!dto.phone || !dto.phone.trim()) {
      throw new BadRequestException('Phone number is mandatory to complete your profile.');
    }
    if (!dto.address || !dto.address.trim()) {
      throw new BadRequestException('Physical address is mandatory to complete your profile.');
    }

    const normalizedPhone = normalizePhoneNumber(dto.phone);
    if (normalizedPhone.length < 10) {
      throw new BadRequestException('Please provide a valid phone number (at least 10-11 digits).');
    }

    // Verify uniqueness in PostgreSQL
    const existingPhone = await this.prisma.user.findFirst({
      where: {
        normalizedPhone,
        NOT: { email: cleanEmail },
      },
    });

    if (existingPhone) {
      throw new BadRequestException(
        'Duplicate number: another user has already registered this phone number. Please use a different number.',
      );
    }

    let avatarUrl = dto.avatar.trim();
    if (avatarUrl.startsWith('data:image/')) {
      const parts = avatarUrl.split(',');
      if (parts.length > 1) {
        const buffer = Buffer.from(parts[1], 'base64');
        const storagePath = `avatars/${Buffer.from(cleanEmail).toString('hex').slice(0, 16)}.png`;
        const uploaded = await this.supabaseService.uploadFile('avatars', storagePath, buffer, 'image/png');
        if (uploaded) {
          avatarUrl = this.supabaseService.getPublicUrl('avatars', storagePath) || storagePath;
        }
      }
    }

    const updatedUser = await this.prisma.user.upsert({
      where: { email: cleanEmail },
      update: {
        displayName: dto.displayName.trim(),
        phone: dto.phone.trim(),
        normalizedPhone,
        whatsapp: (dto.whatsapp || dto.phone).trim(),
        telegramChatId: dto.telegramChatId ? dto.telegramChatId.trim() : undefined,
        address: dto.address.trim(),
        avatarUrl,
        isProfileComplete: true,
      },
      create: {
        email: cleanEmail,
        role: 'USER',
        displayName: dto.displayName.trim(),
        phone: dto.phone.trim(),
        normalizedPhone,
        whatsapp: (dto.whatsapp || dto.phone).trim(),
        telegramChatId: dto.telegramChatId ? dto.telegramChatId.trim() : undefined,
        address: dto.address.trim(),
        avatarUrl,
        isProfileComplete: true,
        plan: '6 Months Pro',
        isPro: true,
        searchLimit: 30,
        searchesLeft: 30,
        reportLimit: 10,
        reportsLeft: 10,
        subscriptionExpiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      },
      include: { SubscriptionRequest: true },
    });

    this.invalidateProfileCache(cleanEmail);

    return {
      success: true,
      message: 'Profile completed successfully!',
      user: {
        ...updatedUser,
        avatar: updatedUser.avatarUrl || '',
      },
    };
  }

  async getUserProfile(email: string) {
    if (!email) throw new BadRequestException('Email is required');
    const cleanEmail = email.toLowerCase().trim();

    const now = Date.now();
    const cached = this.profileCache.get(cleanEmail);
    if (cached && cached.expiresAt > now) {
      return cached.profile;
    }

    const isPromoActive = new Date() <= new Date('2027-01-31T23:59:59.999Z');

    let user = await this.prisma.user.findUnique({
      where: { email: cleanEmail },
      include: { SubscriptionRequest: true },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: cleanEmail,
          role: 'USER',
          plan: isPromoActive ? '6 Months Pro' : 'FREE',
          isPro: isPromoActive,
          searchLimit: isPromoActive ? 30 : 1,
          searchesLeft: isPromoActive ? 30 : 1,
          reportLimit: isPromoActive ? 10 : 0,
          reportsLeft: isPromoActive ? 10 : 0,
          hasClaimedPromo: isPromoActive,
          subscriptionExpiresAt: isPromoActive ? new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) : null,
        },
        include: { SubscriptionRequest: true },
      });
    }

    const hasClaimedPromo = Boolean(user.hasClaimedPromo || user.plan === '6 Months Pro');

    let resolvedAvatar = user.avatarUrl || '';
    if (resolvedAvatar && !resolvedAvatar.startsWith('http') && !resolvedAvatar.startsWith('data:')) {
      const publicUrl = this.supabaseService.getPublicUrl('avatars', resolvedAvatar);
      if (publicUrl) {
        resolvedAvatar = publicUrl;
      }
    }

    const profile = {
      ...user,
      phone: user.phone || '',
      whatsapp: user.whatsapp || '',
      address: user.address || '',
      displayName: user.displayName || user.email?.split('@')[0] || '',
      avatar: resolvedAvatar,
      avatarUrl: resolvedAvatar,
      isProfileComplete: Boolean(user.isProfileComplete && user.phone && user.address),
      promoRewarded: isPromoActive && user.role !== 'ADMIN',
      hasClaimedPromo,
    };

    this.profileCache.set(cleanEmail, { profile, expiresAt: now + 15000 });
    return profile;
  }

  async getUserSearchHistory(email: string) {
    const cleanEmail = email.toLowerCase().trim();
    const searches = await this.prisma.searchLog.findMany({
      where: {
        OR: [
          { userEmail: cleanEmail },
          { user: { email: cleanEmail } },
        ],
      },
      orderBy: { timestamp: 'desc' },
      take: 20,
      include: {
        device: {
          select: {
            status: true,
            riskScore: true,
            riskLevel: true,
            deviceName: true,
            brand: true,
            model: true,
          },
        },
      },
    });

    return searches.map((s) => ({
      id: s.id,
      imei: s.imei,
      result: s.device?.status === 'STOLEN' ? 'Stolen' : s.device?.status === 'SUSPICIOUS' ? 'Suspicious' : 'Clean',
      score: s.device?.riskScore ?? 0,
      location: s.location || 'Dhaka, Bangladesh',
      date: s.timestamp.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    }));
  }

  async getUserInsights(userId: string, email?: string) {
    const userReports = await this.prisma.report.findMany({
      where: {
        OR: [
          ...(userId && userId !== 'mock-user-id' ? [{ userId }] : []),
          ...(email ? [{ userEmail: email.toLowerCase().trim() }] : []),
        ],
      },
      select: { imei: true, deviceName: true, status: true, date: true },
    });

    const userImeis = userReports.map((r) => r.imei).filter(Boolean);
    let userChecks: any[] = [];

    if (userImeis.length > 0) {
      const rawSearches = await this.prisma.searchLog.findMany({
        where: { imei: { in: userImeis } },
        take: 5,
        orderBy: { timestamp: 'desc' },
        select: { imei: true, location: true, timestamp: true },
      });

      userChecks = rawSearches.map((s) => ({
        ...s,
        imei:
          s.imei && s.imei.length === 15
            ? `${s.imei.slice(0, 6)}*****${s.imei.slice(11)}`
            : '***************',
      }));
    }

    const totalVerifiedReports = await this.prisma.report.count({
      where: { status: 'APPROVED' },
    });

    return {
      userId,
      message: 'Personalized device protection insights generated',
      recentChecks: userChecks,
      localRiskTrends: {
        trend: totalVerifiedReports > 10 ? 'Elevated' : 'Moderate',
        verifiedTheftIncidents: totalVerifiedReports,
        advice:
          'Always verify 15-digit IMEI with Phone Koi and demand original purchase receipt before completing second-hand phone purchases.',
      },
    };
  }

  async createSubscriptionRequest(
    email: string,
    dto: { planName: string; price?: number; trxCode: string; bkashLastFour: string },
  ) {
    const user = await this.getUserProfile(email);

    if (dto.planName === '6 Months Pro' || dto.planName.toLowerCase().includes('free')) {
      if (user.hasClaimedPromo || user.plan === '6 Months Pro') {
        throw new BadRequestException(
          'You have already claimed your one-time 6-Month Free Pro promotional offer. Once your promo quota is exhausted, please choose one of our standard packages to recharge your search and report tokens.',
        );
      }
    }

    const authoritativePrice =
      PLAN_PRICING_CATALOG[dto.planName] ?? (dto.price !== undefined ? Number(dto.price) : 49);

    const result = await this.prisma.subscriptionRequest.create({
      data: {
        userId: user.id,
        userEmail: email,
        planName: dto.planName,
        price: authoritativePrice,
        trxCode: dto.trxCode,
        bkashLastFour: dto.bkashLastFour,
        status: 'PENDING',
      },
    });

    this.invalidateProfileCache(email);
    return result;
  }

  async getUserAlerts(email: string) {
    const cleanEmail = email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email: cleanEmail },
      include: {
        reports: {
          include: {
            device: {
              include: {
                searchLogs: {
                  orderBy: { timestamp: 'desc' },
                },
              },
            },
          },
        },
      },
    });

    const alerts: any[] = [];

    if (user?.reports && user.reports.length > 0) {
      for (const report of user.reports) {
        if (report.status === 'APPROVED') {
          alerts.push({
            id: `report-approved-${report.id}`,
            type: 'success',
            title: 'Report Verified',
            desc: `Your stolen device report for ${report.deviceName || 'IMEI ' + report.imei} has been verified and red-flagged.`,
            time: report.updatedAt.toISOString(),
          });
        } else if (report.status === 'REJECTED') {
          alerts.push({
            id: `report-rejected-${report.id}`,
            type: 'info',
            title: 'Report Rejected',
            desc: `Your stolen device report for ${report.deviceName || 'IMEI ' + report.imei} was rejected during admin review.`,
            time: report.updatedAt.toISOString(),
          });
        } else {
          alerts.push({
            id: `report-pending-${report.id}`,
            type: 'info',
            title: 'Report Under Review',
            desc: `Your stolen device report for ${report.deviceName || 'IMEI ' + report.imei} is currently under verification.`,
            time: report.createdAt.toISOString(),
          });
        }

        const logs = report.device?.searchLogs || [];
        const seenIps = new Set<string>();
        for (const log of logs) {
          if (new Date(log.timestamp) > new Date(report.createdAt)) {
            let displayIp = log.ip || '103.112.55.10';
            if (displayIp === '::1' || displayIp === '127.0.0.1') displayIp = '103.112.55.10';
            let displayLocation = log.location || 'Tejgaon, Dhaka';

            if (!seenIps.has(displayIp)) {
              seenIps.add(displayIp);
              alerts.push({
                id: `search-log-${log.id}`,
                type: 'danger',
                title: 'Suspicious Activity',
                desc: `Your reported device (${report.deviceName || 'IMEI ' + report.imei}) was searched from IP ${displayIp}.`,
                time: log.timestamp.toISOString(),
              });
            }
          }
        }
      }
    }

    // Live search events from database
    const dbEvents = await this.prisma.searchEvent.findMany({
      where: { ownerEmail: cleanEmail },
      orderBy: { timestamp: 'desc' },
      take: 20,
    });

    for (const ev of dbEvents) {
      alerts.push({
        id: `search-alert-${ev.id}`,
        type: 'danger',
        title: '🚨 Stolen Device Searched',
        desc: `Your registered ${ev.deviceBrand || ''} ${ev.deviceModel || ev.deviceName} (IMEI ${ev.maskedImei}) was checked from ${ev.locationName}.`,
        time: ev.timestamp.toISOString(),
        searchEventId: ev.id,
        locationSource: ev.locationSource,
        accuracyRadius: ev.accuracyRadius,
        latitude: ev.latitude,
        longitude: ev.longitude,
      });
    }

    if (alerts.length === 0) {
      alerts.push({
        id: 'system-welcome',
        type: 'info',
        title: 'System Tracking Active',
        desc: 'Welcome to Phone Koi Safety watchlist. Your account registry is live and scanning for risk vectors.',
        time: user?.createdAt ? user.createdAt.toISOString() : new Date().toISOString(),
      });
    }

    return alerts.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }

  async linkTelegramChatId(email: string, chatId: string) {
    const cleanEmail = email.toLowerCase().trim();
    const cleanChatId = chatId ? chatId.trim() : null;
    const user = await this.prisma.user.update({
      where: { email: cleanEmail },
      data: { telegramChatId: cleanChatId },
    });
    this.invalidateProfileCache(cleanEmail);
    return { success: true, telegramChatId: user.telegramChatId };
  }

  async testUserTelegram(email: string) {
    const cleanEmail = email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email: cleanEmail },
      select: { id: true, email: true, displayName: true, telegramChatId: true },
    });
    if (!user || !user.telegramChatId) {
      throw new BadRequestException('No Telegram account is linked. Please link your Telegram first.');
    }
    const config = await this.alertDispatcher.getGatewaysConfig();
    const botToken = config.telegram?.botToken;
    if (!botToken || botToken.includes('...')) {
      throw new BadRequestException('Telegram Bot gateway is not configured by system administrator.');
    }
    await this.alertDispatcher.sendTelegramMessage(
      botToken,
      user.telegramChatId,
      `🚨 *PhoneKoi Security Test Alert!*\n\n` +
      `Hello *${user.displayName || user.email}*! Your Telegram push alert connection is active and working.\n\n` +
      `Whenever an IMEI query is performed for your lost/stolen device, real-time GPS telemetry will be delivered directly here.`
    );
    return { success: true, message: `Test security alert delivered to Telegram Chat ID: ${user.telegramChatId}` };
  }
}

