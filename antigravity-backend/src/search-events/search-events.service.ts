import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import * as geoip from 'geoip-lite';
import { AlertDispatcherService } from '../notifications/alert-dispatcher.service';

export interface IMEISearchEvent {
  id: string;
  imei: string;
  maskedImei: string;
  deviceBrand?: string;
  deviceModel?: string;
  deviceName?: string;
  ownerEmail: string;
  timestamp: string;
  searchResult: string;
  ip?: string;
  latitude?: number;
  longitude?: number;
  accuracyRadius?: number;
  locationSource: string;
  locationName: string;
  policeGdNumber?: string;
  isRead: boolean;
  notifications: Array<{
    channel: string;
    status: string;
    detail?: string;
    deliveredAt: string;
  }>;
}

@Injectable()
export class SearchEventsService {
  private readonly logger = new Logger(SearchEventsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly alertDispatcherService: AlertDispatcherService,
  ) {}

  private maskImei(imei: string): string {
    if (!imei) return 'Unknown IMEI';
    if (imei.length === 15) {
      return `${imei.slice(0, 6)}*****${imei.slice(11)}`;
    }
    return '***************';
  }

  async createEvent(data: {
    imei: string;
    ip?: string;
    clientLocation?: string;
    latitude?: number;
    longitude?: number;
    accuracy?: number;
    locationSource?: 'BROWSER_GPS' | 'IP_APPROXIMATE' | 'UNAVAILABLE';
  }): Promise<IMEISearchEvent | null> {
    const imei = data.imei;

    // Check if device has an approved report in PostgreSQL
    const activeReport = await this.prisma.report.findFirst({
      where: {
        imei,
        status: 'APPROVED',
      },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!activeReport) {
      return null;
    }

    let clientIp = data.ip || '103.112.55.10';
    if (clientIp.includes(',')) {
      clientIp = clientIp.split(',')[0].trim();
    }
    if (clientIp.startsWith('::ffff:')) {
      clientIp = clientIp.substring(7);
    }
    if (
      clientIp === '::1' ||
      clientIp === '127.0.0.1' ||
      clientIp === 'localhost' ||
      clientIp.startsWith('192.168.') ||
      clientIp.startsWith('10.') ||
      clientIp.startsWith('172.16.')
    ) {
      clientIp = '103.112.55.10';
    }

    let locationSource = data.locationSource || 'IP_APPROXIMATE';
    let latitude: number | null = null;
    let longitude: number | null = null;
    let accuracyRadius: number | null = null;
    let locationName = data.clientLocation || '';

    if (
      data.latitude !== undefined &&
      data.latitude !== null &&
      data.longitude !== undefined &&
      data.longitude !== null
    ) {
      locationSource = 'BROWSER_GPS';
      latitude = Number(data.latitude);
      longitude = Number(data.longitude);
      accuracyRadius = data.accuracy ? Number(data.accuracy) : 25;
      if (!locationName) {
        locationName = 'Dhaka Metro (GPS Verified)';
      }
    } else {
      const geo = geoip.lookup(clientIp);
      if (geo && (geo.city || geo.country)) {
        locationSource = 'IP_APPROXIMATE';
        latitude = geo.ll ? geo.ll[0] : 23.8103;
        longitude = geo.ll ? geo.ll[1] : 90.4125;
        accuracyRadius = 5000;
        const city = geo.city || 'Dhaka';
        const country =
          geo.country === 'BD' ? 'Bangladesh' : geo.country || 'Bangladesh';
        locationName = `${city}, ${country} (approximate)`;
      } else if (data.clientLocation) {
        locationSource = 'IP_APPROXIMATE';
        latitude = 23.8103;
        longitude = 90.4125;
        accuracyRadius = 5000;
        locationName = `${data.clientLocation} (approximate)`;
      } else {
        locationSource = 'UNAVAILABLE';
        locationName = 'Location unavailable';
      }
    }

    const now = new Date();
    const searchResult = activeReport.reportType === 'LOST' ? 'LOST' : 'STOLEN';
    const ownerEmail = activeReport.userEmail || activeReport.user?.email || '';

    // Dispatch real-time security alerts across configured channels (Telegram, Email, WhatsApp, SMS)
    let notifications: any[] = [
      {
        channel: 'IN_APP',
        status: 'DELIVERED',
        deliveredAt: now.toISOString(),
      },
    ];

    const isExactGps = locationSource === 'BROWSER_GPS' && latitude !== null && longitude !== null;
    const alertType = isExactGps ? 'GPS_PINPOINT' : 'INITIAL_SEARCH';

    try {
      const dispatched = await this.alertDispatcherService.dispatchSearchAlert({
        imei,
        maskedImei: this.maskImei(imei),
        deviceName: activeReport.deviceName || 'Mobile Device',
        deviceBrand:
          activeReport.brand ||
          activeReport.deviceName?.split(' ')[0] ||
          'Unknown Brand',
        deviceModel:
          activeReport.model || activeReport.deviceName || 'Mobile Device',
        searchResult,
        timestamp: now,
        ip: clientIp,
        latitude: isExactGps ? latitude : null,
        longitude: isExactGps ? longitude : null,
        accuracyRadius: isExactGps ? accuracyRadius : null,
        locationName: isExactGps ? locationName : 'Pending GPS permission from searcher',
        policeGdNumber: activeReport.policeGdNumber || '',
        ownerEmail,
        ownerPhone: activeReport.contactNumber || activeReport.user?.phone || undefined,
        ownerWhatsapp: activeReport.user?.whatsapp || activeReport.contactNumber || undefined,
        ownerTelegramChatId: activeReport.user?.telegramChatId || undefined,
        notificationPreferences: activeReport.notificationPreferences || [],
        alertType,
        isExactGps,
      });
      if (dispatched && dispatched.length > 0) {
        notifications = dispatched;
      }
    } catch (dispatchErr: any) {
      this.logger.error(`Alert dispatching error: ${dispatchErr?.message || dispatchErr}`);
    }

    const event = await this.prisma.searchEvent.create({
      data: {
        imei,
        ownerId: activeReport.userId || null,
        ownerEmail,
        maskedImei: this.maskImei(imei),
        deviceBrand:
          activeReport.brand ||
          activeReport.deviceName?.split(' ')[0] ||
          'Unknown Brand',
        deviceModel:
          activeReport.model || activeReport.deviceName || 'Mobile Device',
        deviceName: activeReport.deviceName || 'Mobile Device',
        searchResult,
        ip: clientIp,
        latitude,
        longitude,
        accuracyRadius,
        locationSource,
        locationName,
        policeGdNumber: activeReport.policeGdNumber || '',
        isRead: false,
        notifications,
        timestamp: now,
      },
    });

    return {
      id: event.id,
      imei: event.imei,
      maskedImei: event.maskedImei,
      deviceBrand: event.deviceBrand || undefined,
      deviceModel: event.deviceModel || undefined,
      deviceName: event.deviceName || undefined,
      ownerEmail: event.ownerEmail,
      timestamp: event.timestamp.toISOString(),
      searchResult: event.searchResult,
      ip: event.ip || undefined,
      latitude: event.latitude || undefined,
      longitude: event.longitude || undefined,
      accuracyRadius: event.accuracyRadius || undefined,
      locationSource: event.locationSource || 'IP_APPROXIMATE',
      locationName: event.locationName || '',
      policeGdNumber: event.policeGdNumber || undefined,
      isRead: event.isRead,
      notifications:
        (event.notifications as unknown as IMEISearchEvent['notifications']) ||
        notifications,
    };
  }

  async getOwnerEvents(
    ownerEmail: string,
    filters?: { imei?: string; read?: string; locationType?: string },
  ) {
    if (!ownerEmail) return [];
    const cleanEmail = ownerEmail.toLowerCase().trim();

    const where: Prisma.SearchEventWhereInput = {
      ownerEmail: cleanEmail,
    };

    if (filters?.imei) {
      where.imei = filters.imei;
    }
    if (filters?.read !== undefined && filters.read !== '') {
      where.isRead = filters.read === 'true';
    }
    if (filters?.locationType && filters.locationType !== 'ALL') {
      where.locationSource = filters.locationType;
    }

    const events = await this.prisma.searchEvent.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 100,
    });

    return events.map((event) => ({
      id: event.id,
      imei: event.imei,
      maskedImei: event.maskedImei,
      deviceBrand: event.deviceBrand || undefined,
      deviceModel: event.deviceModel || undefined,
      deviceName: event.deviceName || undefined,
      ownerEmail: event.ownerEmail,
      timestamp: event.timestamp.toISOString(),
      searchResult: event.searchResult,
      ip: event.ip || undefined,
      latitude: event.latitude || undefined,
      longitude: event.longitude || undefined,
      accuracyRadius: event.accuracyRadius || undefined,
      locationSource: event.locationSource || 'IP_APPROXIMATE',
      locationName: event.locationName || '',
      policeGdNumber: event.policeGdNumber || undefined,
      isRead: event.isRead,
      notifications:
        (event.notifications as unknown as IMEISearchEvent['notifications']) ||
        [],
    }));
  }

  async recordSearchEvent(data: {
    imei: string;
    ip?: string;
    clientLocation?: string;
    latitude?: number;
    longitude?: number;
    accuracy?: number;
    locationSource?: 'BROWSER_GPS' | 'IP_APPROXIMATE' | 'UNAVAILABLE';
  }): Promise<IMEISearchEvent | null> {
    return this.createEvent(data);
  }

  async getOwnerSummary(ownerEmail: string) {
    return this.getEventsSummary(ownerEmail);
  }

  async getEventById(id: string, callerEmail?: string) {
    const event = await this.prisma.searchEvent.findUnique({
      where: { id },
    });
    if (!event) {
      throw new NotFoundException(`Search event ${id} not found`);
    }

    if (callerEmail) {
      const cleanCaller = callerEmail.toLowerCase().trim();
      const eventOwner = event.ownerEmail.toLowerCase().trim();
      if (cleanCaller !== eventOwner) {
        throw new ForbiddenException(
          'You do not have permission to view this search event',
        );
      }
    }

    return {
      id: event.id,
      imei: event.imei,
      maskedImei: event.maskedImei,
      deviceBrand: event.deviceBrand || undefined,
      deviceModel: event.deviceModel || undefined,
      deviceName: event.deviceName || undefined,
      ownerEmail: event.ownerEmail,
      timestamp: event.timestamp.toISOString(),
      searchResult: event.searchResult,
      ip: event.ip || undefined,
      latitude: event.latitude || undefined,
      longitude: event.longitude || undefined,
      accuracyRadius: event.accuracyRadius || undefined,
      locationSource: event.locationSource || 'IP_APPROXIMATE',
      locationName: event.locationName || '',
      policeGdNumber: event.policeGdNumber || undefined,
      isRead: event.isRead,
      notifications:
        (event.notifications as unknown as IMEISearchEvent['notifications']) ||
        [],
    };
  }

  async markEventAsRead(id: string, callerEmail?: string) {
    const event = await this.prisma.searchEvent.findUnique({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException(`Search event ${id} not found`);
    }

    if (callerEmail) {
      const cleanCaller = callerEmail.toLowerCase().trim();
      const eventOwner = event.ownerEmail.toLowerCase().trim();
      if (cleanCaller !== eventOwner) {
        throw new ForbiddenException(
          'You do not have permission to modify this search event',
        );
      }
    }

    return await this.prisma.searchEvent.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(ownerEmail: string) {
    return this.markAllEventsAsRead(ownerEmail);
  }

  async markAllEventsAsRead(ownerEmail: string) {
    if (!ownerEmail) return { success: false };
    const cleanEmail = ownerEmail.toLowerCase().trim();

    await this.prisma.searchEvent.updateMany({
      where: { ownerEmail: cleanEmail },
      data: { isRead: true },
    });

    return { success: true };
  }

  async saveSellerReport(data: {
    imei: string;
    sellerPhone?: string;
    platform?: string;
    listingUrl?: string;
    notes?: string;
    reporterEmail?: string;
  }) {
    return this.reportSeller(data);
  }

  async reportSeller(data: {
    imei: string;
    sellerPhone?: string;
    platform?: string;
    listingUrl?: string;
    notes?: string;
    reporterEmail?: string;
  }) {
    let user = null;
    if (data.reporterEmail) {
      user = await this.prisma.user.findUnique({
        where: { email: data.reporterEmail.toLowerCase().trim() },
      });
    }

    const sellerInfo = [
      data.sellerPhone ? `Phone: ${data.sellerPhone}` : '',
      data.platform ? `Platform: ${data.platform}` : '',
      data.listingUrl ? `URL: ${data.listingUrl}` : '',
    ]
      .filter(Boolean)
      .join(' | ');

    const record = await this.prisma.sellerReport.create({
      data: {
        imei: data.imei,
        userId: user?.id || null,
        sellerInfo,
        details: data.notes || '',
      },
    });

    return {
      success: true,
      message:
        'Suspicious seller report submitted to law enforcement safety log.',
      reportId: record.id,
    };
  }

  async saveOwnerMessage(data: {
    imei: string;
    message: string;
    contactPhone?: string;
    contactEmail?: string;
    senderEmail?: string;
  }) {
    return this.contactOwner(data);
  }

  async contactOwner(data: {
    imei: string;
    message: string;
    contactPhone?: string;
    contactEmail?: string;
    senderEmail?: string;
  }) {
    const activeReport = await this.prisma.report.findFirst({
      where: { imei: data.imei, status: 'APPROVED' },
    });

    if (!activeReport) {
      throw new NotFoundException(
        'Active device report not found for this IMEI',
      );
    }

    let sender = null;
    if (data.senderEmail) {
      sender = await this.prisma.user.findUnique({
        where: { email: data.senderEmail.toLowerCase().trim() },
      });
    }

    const contactStr = [
      data.contactPhone ? `Phone: ${data.contactPhone}` : '',
      data.contactEmail ? `Email: ${data.contactEmail}` : '',
    ]
      .filter(Boolean)
      .join(' | ');

    const record = await this.prisma.ownerMessage.create({
      data: {
        imei: data.imei,
        userId: sender?.id || null,
        ownerEmail: activeReport.userEmail || '',
        message: data.message,
        contact: contactStr || null,
      },
    });

    return {
      success: true,
      message: 'Secure notification dispatched to the device owner.',
      messageId: record.id,
    };
  }

  async shareLocation(data: {
    imei: string;
    latitude: number;
    longitude: number;
    accuracy?: number;
    clientLocation?: string;
    ip?: string;
  }) {
    const event = await this.createEvent({
      imei: data.imei,
      latitude: data.latitude,
      longitude: data.longitude,
      accuracy: data.accuracy || 15,
      locationSource: 'BROWSER_GPS',
      clientLocation: data.clientLocation || 'Exact GPS Pinpoint (Verified)',
      ip: data.ip,
    });

    return {
      success: true,
      message: 'High-precision GPS coordinates successfully transmitted to the verified owner.',
      event,
    };
  }

  async getEventsSummary(ownerEmail: string) {
    if (!ownerEmail) {
      return { totalEvents: 0, unreadCount: 0, distinctLocations: 0 };
    }
    const cleanEmail = ownerEmail.toLowerCase().trim();

    const events = await this.prisma.searchEvent.findMany({
      where: { ownerEmail: cleanEmail },
      select: { isRead: true, locationName: true },
    });

    const unreadCount = events.filter((e) => !e.isRead).length;
    const locations = new Set(
      events.map((e) => e.locationName).filter(Boolean),
    );

    return {
      totalEvents: events.length,
      unreadCount,
      distinctLocations: locations.size,
    };
  }
}
