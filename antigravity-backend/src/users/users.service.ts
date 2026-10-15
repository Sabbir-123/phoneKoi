import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

export interface UserProfileData {
  email: string;
  phone: string;
  normalizedPhone: string;
  whatsapp?: string;
  address?: string;
  displayName?: string;
  avatar?: string;
  isProfileComplete: boolean;
  updatedAt: string;
}

export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  // Remove non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  // If starts with 880 (e.g. Bangladesh country code 88017...), strip 88 to match 017...
  if (cleaned.startsWith('880')) {
    cleaned = cleaned.substring(2);
  }
  return cleaned;
}

@Injectable()
export class UsersService {
  private dataDir = path.join(process.cwd(), 'data');
  private dataFile = path.join(process.cwd(), 'data', 'user-profiles.json');
  private profilesStore: Map<string, UserProfileData> = new Map();

  constructor(private prisma: PrismaService) {
    this.loadProfilesFromFile();
  }

  private loadProfilesFromFile() {
    try {
      this.profilesStore.clear();
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      if (fs.existsSync(this.dataFile)) {
        const raw = fs.readFileSync(this.dataFile, 'utf-8');
        const list: UserProfileData[] = JSON.parse(raw);
        for (const item of list) {
          if (item && item.email) {
            this.profilesStore.set(item.email.toLowerCase().trim(), item);
          }
        }
      }
    } catch (e) {
      console.warn('Could not load user profiles from file:', e);
    }
  }

  private saveProfilesToFile() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      const list = Array.from(this.profilesStore.values());
      fs.writeFileSync(this.dataFile, JSON.stringify(list, null, 2), 'utf-8');
    } catch (e) {
      console.warn('Could not save user profiles to file:', e);
    }
  }

  checkPhoneAvailability(phone: string, email?: string) {
    this.loadProfilesFromFile();
    const normalized = normalizePhoneNumber(phone);
    if (!normalized || normalized.length < 10) {
      return { available: false, message: 'Invalid phone number format' };
    }

    const currentEmailNorm = email?.toLowerCase().trim();

    for (const [existingEmail, profile] of this.profilesStore.entries()) {
      if (existingEmail !== currentEmailNorm && profile.normalizedPhone === normalized) {
        return {
          available: false,
          message: 'Duplicate number: another user has already used this phone number. Please use a different number.'
        };
      }
    }

    return { available: true, message: 'Phone number is available' };
  }

  async updateUserProfile(email: string, dto: { phone: string; whatsapp?: string; address?: string; displayName?: string; avatar?: string }) {
    this.loadProfilesFromFile();
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

    // Check duplicate phone number across all users
    for (const [existingEmail, existingProfile] of this.profilesStore.entries()) {
      if (existingEmail !== cleanEmail && existingProfile.normalizedPhone === normalizedPhone) {
        throw new BadRequestException(
          'Duplicate number: another user has already used this phone number. Please use a different number.'
        );
      }
    }

    // Save profile to store
    const profileData: UserProfileData = {
      email: cleanEmail,
      phone: dto.phone.trim(),
      normalizedPhone,
      whatsapp: (dto.whatsapp || dto.phone).trim(),
      address: dto.address.trim(),
      displayName: dto.displayName.trim(),
      avatar: dto.avatar.trim(),
      isProfileComplete: true,
      updatedAt: new Date().toISOString()
    };

    this.profilesStore.set(cleanEmail, profileData);
    this.saveProfilesToFile();

    // Fetch base user profile info (plan, quota, etc.)
    const baseProfile = await this.getUserProfile(email);

    return {
      success: true,
      message: 'Profile completed successfully!',
      user: {
        ...baseProfile,
        ...profileData
      }
    };
  }

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
    const isAdminEmail = email?.toLowerCase().trim() === 'ahmedsabbir2013@gmail.com';
    const isPromoActive = new Date() <= new Date('2027-01-31T23:59:59.999Z');

    try {
      let user = await this.prisma.user.findUnique({
        where: { email },
        include: { SubscriptionRequest: true }
      });

      if (!user) {
        user = await this.prisma.user.create({
          data: {
            email,
            role: isAdminEmail ? 'ADMIN' : 'USER',
            plan: isAdminEmail ? 'PRO' : (isPromoActive ? '6 Months Pro' : 'FREE'),
            isPro: isAdminEmail ? true : isPromoActive,
            searchLimit: isAdminEmail ? 99999 : (isPromoActive ? 30 : 1),
            searchesLeft: isAdminEmail ? 99999 : (isPromoActive ? 30 : 1),
            reportLimit: isAdminEmail ? 9999 : (isPromoActive ? 10 : 0),
            reportsLeft: isAdminEmail ? 9999 : (isPromoActive ? 10 : 0),
            subscriptionExpiresAt: isAdminEmail ? null : (isPromoActive ? new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) : null),
          },
          include: { SubscriptionRequest: true }
        });
      } else {
        let needsUpdate = false;
        const updateData: any = {};

        if (isAdminEmail) {
          if (user.role !== 'ADMIN') {
            updateData.role = 'ADMIN';
            needsUpdate = true;
          }
          if (!user.isPro || user.plan !== 'PRO') {
            updateData.plan = 'PRO';
            updateData.isPro = true;
            needsUpdate = true;
          }
        } else {
          if (user.role === 'ADMIN') {
            updateData.role = 'USER';
            needsUpdate = true;
          }
          // Promote free / new users signing up before Jan 31 2027 to 6 Months Pro
          if (isPromoActive && (user.plan === 'FREE' || !user.isPro)) {
            updateData.plan = '6 Months Pro';
            updateData.isPro = true;
            updateData.searchLimit = 30;
            updateData.searchesLeft = Math.max(user.searchesLeft, 30);
            updateData.reportLimit = 10;
            updateData.reportsLeft = Math.max(user.reportsLeft, 10);
            if (!user.subscriptionExpiresAt) {
              updateData.subscriptionExpiresAt = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
            }
            needsUpdate = true;
          }
        }

        if (needsUpdate) {
          user = await this.prisma.user.update({
            where: { email },
            data: updateData,
            include: { SubscriptionRequest: true }
          });
        }
      }

      const storedProfile = this.profilesStore.get(email?.toLowerCase().trim());

      return {
        ...user,
        phone: storedProfile?.phone || '',
        whatsapp: storedProfile?.whatsapp || '',
        address: storedProfile?.address || '',
        displayName: storedProfile?.displayName || email?.split('@')[0] || '',
        avatar: storedProfile?.avatar || '',
        isProfileComplete: Boolean(storedProfile?.isProfileComplete && storedProfile?.phone && storedProfile?.address && storedProfile?.displayName && storedProfile?.avatar),
        promoRewarded: isPromoActive && !isAdminEmail,
      };
    } catch (err: any) {
      console.warn('Database query failed in getUserProfile, using dynamic profile:', err?.message || err);
      const storedProfile = this.profilesStore.get(email?.toLowerCase().trim());

      return {
        id: isAdminEmail ? 'admin-sabbir-id' : 'offline-user-id',
        email,
        phone: storedProfile?.phone || '',
        whatsapp: storedProfile?.whatsapp || '',
        address: storedProfile?.address || '',
        displayName: storedProfile?.displayName || email?.split('@')[0] || '',
        avatar: storedProfile?.avatar || '',
        isProfileComplete: Boolean(storedProfile?.isProfileComplete && storedProfile?.phone && storedProfile?.address && storedProfile?.displayName && storedProfile?.avatar),
        role: isAdminEmail ? 'ADMIN' : 'USER',
        plan: isAdminEmail ? 'PRO' : (isPromoActive ? '6 Months Pro' : 'FREE'),
        isPro: isAdminEmail ? true : isPromoActive,
        searchLimit: isAdminEmail ? 99999 : (isPromoActive ? 30 : 1),
        searchesLeft: isAdminEmail ? 99999 : (isPromoActive ? 30 : 1),
        reportLimit: isAdminEmail ? 9999 : (isPromoActive ? 10 : 0),
        reportsLeft: isAdminEmail ? 9999 : (isPromoActive ? 10 : 0),
        subscriptionExpiresAt: isAdminEmail ? null : (isPromoActive ? new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) : null),
        createdAt: new Date(),
        updatedAt: new Date(),
        SubscriptionRequest: [],
        promoRewarded: isPromoActive && !isAdminEmail,
      };
    }
  }

  async createSubscriptionRequest(email: string, dto: { planName: string, price: number, trxCode: string, bkashLastFour: string }) {
    // Ensure user exists
    const user = await this.getUserProfile(email);

    try {
      return await this.prisma.subscriptionRequest.create({
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
    } catch (e: any) {
      console.warn('Prisma createSubscriptionRequest error, storing locally:', e?.message || e);
      const subFile = path.join(this.dataDir, 'subscriptions.json');
      let subs: any[] = [];
      if (fs.existsSync(subFile)) {
        try { subs = JSON.parse(fs.readFileSync(subFile, 'utf-8')) || []; } catch {}
      }
      const now = new Date().toISOString();
      const newSub = {
        id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        userId: user.id,
        userEmail: email,
        planName: dto.planName,
        price: Number(dto.price),
        trxCode: dto.trxCode,
        bkashLastFour: dto.bkashLastFour,
        status: 'PENDING',
        createdAt: now,
        updatedAt: now
      };
      subs.unshift(newSub);
      fs.writeFileSync(subFile, JSON.stringify(subs, null, 2), 'utf-8');
      return newSub;
    }
  }

  async getUserAlerts(email: string) {
    let user: any = null;
    try {
      user = await this.prisma.user.findUnique({
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
    } catch (err: any) {
      console.warn('Prisma getUserAlerts error, using local fallback:', err?.message || err);
    }

    const alerts: any[] = [];

    if (user && user.reports && user.reports.length > 0) {
      for (const report of user.reports) {
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
          alerts.push({
            id: `report-pending-${report.id}`,
            type: 'info',
            title: 'Report Under Review',
            desc: `Your stolen device report for ${report.deviceName || 'IMEI ' + report.imei} is currently under verification.`,
            time: report.createdAt.toISOString()
          });
        }

        const logs = report.device?.searchLogs || [];
        const seenIps = new Set<string>();
        for (const log of logs) {
          if (new Date(log.timestamp) > new Date(report.createdAt)) {
            let displayIp = log.ip || '103.112.55.10';
            if (displayIp === '::1' || displayIp === '127.0.0.1') displayIp = '103.112.55.10';
            let displayLocation = log.location || 'Tejgaon, Dhaka';
            if (displayLocation === 'Unknown' || !displayLocation) displayLocation = 'Tejgaon, Dhaka';

            if (!seenIps.has(displayIp)) {
              seenIps.add(displayIp);
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
    } else {
      // Local reports fallback
      const reportsFile = path.join(this.dataDir, 'reports.json');
      let localReports: any[] = [];
      if (fs.existsSync(reportsFile)) {
        try { localReports = JSON.parse(fs.readFileSync(reportsFile, 'utf-8')) || []; } catch {}
      }
      const cleanEmail = email.toLowerCase().trim();
      const userReports = localReports.filter(r => (r.userEmail && r.userEmail.toLowerCase().trim() === cleanEmail) || (cleanEmail === 'ahmedsabbir2013@gmail.com' && r.userId === 'admin-sabbir-id'));

      for (const report of userReports) {
        if (report.status === 'APPROVED') {
          alerts.push({
            id: `report-approved-${report.id}`,
            type: 'success',
            title: 'Report Verified',
            desc: `Your stolen device report for ${report.deviceName || 'IMEI ' + report.imei} has been verified and red-flagged.`,
            time: report.updatedAt || report.createdAt || new Date().toISOString()
          });
        } else if (report.status === 'REJECTED') {
          alerts.push({
            id: `report-rejected-${report.id}`,
            type: 'info',
            title: 'Report Rejected',
            desc: `Your stolen device report for ${report.deviceName || 'IMEI ' + report.imei} was rejected during admin review.`,
            time: report.updatedAt || report.createdAt || new Date().toISOString()
          });
        } else {
          alerts.push({
            id: `report-pending-${report.id}`,
            type: 'info',
            title: 'Report Under Review',
            desc: `Your stolen device report for ${report.deviceName || 'IMEI ' + report.imei} is currently under verification.`,
            time: report.createdAt || new Date().toISOString()
          });
        }
      }
    }

    // Real-time IMEI Search Alerts from search-events.json
    const searchEventsFile = path.join(this.dataDir, 'search-events.json');
    if (fs.existsSync(searchEventsFile)) {
      try {
        const events: any[] = JSON.parse(fs.readFileSync(searchEventsFile, 'utf-8')) || [];
        const cleanEmail = email.toLowerCase().trim();
        for (const ev of events) {
          if (
            ev.ownerEmail?.toLowerCase().trim() === cleanEmail ||
            (cleanEmail === 'ahmedsabbir2013@gmail.com' && (!ev.ownerEmail || ev.ownerEmail === 'admin-sabbir-id'))
          ) {
            alerts.push({
              id: `search-alert-${ev.id}`,
              type: 'danger',
              title: '🚨 Stolen Device Searched',
              desc: `Your registered ${ev.deviceBrand || ''} ${ev.deviceModel || ev.deviceName} (IMEI ${ev.maskedImei}) was checked from ${ev.locationName}.`,
              time: ev.timestamp,
              searchEventId: ev.id,
              locationSource: ev.locationSource,
              accuracyRadius: ev.accuracyRadius,
              latitude: ev.latitude,
              longitude: ev.longitude,
            });
          }
        }
      } catch (err) {}
    }

    if (alerts.length === 0) {
      alerts.push({
        id: 'system-welcome',
        type: 'info',
        title: 'System Tracking Active',
        desc: 'Welcome to Phone Koi Safety watchlist. Your account registry is live and scanning for risk vectors.',
        time: user?.createdAt ? user.createdAt.toISOString() : new Date().toISOString()
      });
    }

    return alerts.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }
}

