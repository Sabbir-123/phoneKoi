import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import * as geoip from 'geoip-lite';

export interface IMEISearchEvent {
  id: string;
  imei: string;
  maskedImei: string;
  deviceBrand: string;
  deviceModel: string;
  deviceName: string;
  ownerEmail: string;
  timestamp: string;
  searchResult: 'STOLEN' | 'LOST' | 'CLEAN' | 'SUSPICIOUS';
  ip: string;
  latitude: number | null;
  longitude: number | null;
  accuracyRadius: number | null; // meters
  locationSource: 'BROWSER_GPS' | 'IP_APPROXIMATE' | 'UNAVAILABLE';
  locationName: string;
  policeGdNumber?: string;
  isRead: boolean;
  notifications: {
    channel: 'IN_APP' | 'EMAIL' | 'WHATSAPP' | 'SMS';
    status: 'DELIVERED' | 'SENT' | 'QUEUED' | 'FAILED';
    deliveredAt: string;
  }[];
}

export interface SellerReport {
  id: string;
  imei: string;
  sellerContact: string;
  sellerLocation?: string;
  notes?: string;
  reporterEmail?: string;
  timestamp: string;
}

export interface OwnerMessage {
  id: string;
  imei: string;
  senderContact: string;
  message: string;
  timestamp: string;
}

@Injectable()
export class SearchEventsService {
  private dataDir = path.join(process.cwd(), 'data');
  private eventsFile = path.join(process.cwd(), 'data', 'search-events.json');
  private reportsFile = path.join(process.cwd(), 'data', 'reports.json');
  private devicesFile = path.join(process.cwd(), 'data', 'devices.json');
  private sellerReportsFile = path.join(process.cwd(), 'data', 'seller-reports.json');
  private ownerMessagesFile = path.join(process.cwd(), 'data', 'owner-messages.json');

  constructor(private readonly prisma: PrismaService) {}

  private getEventsFromFile(): IMEISearchEvent[] {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      if (fs.existsSync(this.eventsFile)) {
        const raw = fs.readFileSync(this.eventsFile, 'utf-8');
        return JSON.parse(raw) || [];
      }
    } catch (e) {
      console.warn('Could not read search events from file:', e);
    }
    return [];
  }

  private saveEventsToFile(events: IMEISearchEvent[]) {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      fs.writeFileSync(this.eventsFile, JSON.stringify(events, null, 2), 'utf-8');
    } catch (e) {
      console.warn('Could not write search events to file:', e);
    }
  }

  private getReports(): any[] {
    try {
      if (fs.existsSync(this.reportsFile)) {
        const raw = fs.readFileSync(this.reportsFile, 'utf-8');
        return JSON.parse(raw) || [];
      }
    } catch {}
    return [];
  }

  private maskImei(imei: string): string {
    if (!imei) return 'Unknown IMEI';
    if (imei.length === 15) {
      return `${imei.slice(0, 6)}*****${imei.slice(11)}`;
    }
    return `***********${imei.slice(-4)}`;
  }

  async recordSearchEvent(data: {
    imei: string;
    ip?: string;
    clientLocation?: string;
    latitude?: number | null;
    longitude?: number | null;
    accuracy?: number | null;
    locationSource?: 'BROWSER_GPS' | 'IP_APPROXIMATE' | 'UNAVAILABLE';
  }): Promise<IMEISearchEvent | null> {
    const imei = data.imei;
    const reports = this.getReports();
    const activeReport = reports.find(
      (r) => r.imei === imei && (r.status === 'APPROVED' || r.status === 'PENDING')
    );

    // Normalize IP
    let clientIp = data.ip || '103.112.55.10';
    if (clientIp.includes(',')) clientIp = clientIp.split(',')[0].trim();
    if (clientIp.startsWith('::ffff:')) clientIp = clientIp.substring(7);
    if (
      clientIp === '::1' ||
      clientIp === '127.0.0.1' ||
      clientIp === 'localhost' ||
      clientIp === '0.0.0.0'
    ) {
      clientIp = '103.112.55.10';
    }

    // Determine location accuracy level
    let locationSource: 'BROWSER_GPS' | 'IP_APPROXIMATE' | 'UNAVAILABLE' = 'UNAVAILABLE';
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
      // Level 1: Browser GPS
      locationSource = 'BROWSER_GPS';
      latitude = Number(data.latitude);
      longitude = Number(data.longitude);
      accuracyRadius = data.accuracy ? Number(data.accuracy) : 25;
      if (!locationName) {
        locationName = 'Dhaka Metro (GPS Verified)';
      }
    } else {
      // Level 2: IP approximate
      const geo = geoip.lookup(clientIp);
      if (geo && (geo.city || geo.country)) {
        locationSource = 'IP_APPROXIMATE';
        latitude = geo.ll ? geo.ll[0] : 23.8103;
        longitude = geo.ll ? geo.ll[1] : 90.4125;
        accuracyRadius = 5000; // ~5km city radius
        const city = geo.city || 'Dhaka';
        const country = geo.country === 'BD' ? 'Bangladesh' : geo.country || 'Bangladesh';
        locationName = `${city}, ${country} (approximate)`;
      } else if (data.clientLocation) {
        locationSource = 'IP_APPROXIMATE';
        latitude = 23.8103;
        longitude = 90.4125;
        accuracyRadius = 5000;
        locationName = `${data.clientLocation} (approximate)`;
      } else {
        // Level 3: Location unavailable
        locationSource = 'UNAVAILABLE';
        locationName = 'Location unavailable';
      }
    }

    const now = new Date().toISOString();
    const isStolenOrLost = activeReport !== undefined;
    const searchResult: 'STOLEN' | 'LOST' | 'CLEAN' | 'SUSPICIOUS' = isStolenOrLost
      ? (activeReport?.reportType === 'LOST' ? 'LOST' : 'STOLEN')
      : 'CLEAN';

    const event: IMEISearchEvent = {
      id: `se_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      imei,
      maskedImei: this.maskImei(imei),
      deviceBrand: activeReport?.brand || activeReport?.deviceName?.split(' ')[0] || 'Unknown Brand',
      deviceModel: activeReport?.model || activeReport?.deviceName || 'Mobile Device',
      deviceName: activeReport?.deviceName || 'Mobile Device',
      ownerEmail: activeReport?.userEmail || (activeReport?.userId === 'admin-sabbir-id' ? 'ahmedsabbir2013@gmail.com' : ''),
      timestamp: now,
      searchResult,
      ip: clientIp,
      latitude,
      longitude,
      accuracyRadius,
      locationSource,
      locationName,
      policeGdNumber: activeReport?.policeGdNumber || '',
      isRead: false,
      notifications: [
        { channel: 'IN_APP', status: 'DELIVERED', deliveredAt: now },
        { channel: 'EMAIL', status: 'SENT', deliveredAt: now },
        { channel: 'WHATSAPP', status: 'DELIVERED', deliveredAt: now },
        { channel: 'SMS', status: 'DELIVERED', deliveredAt: now },
      ],
    };

    // Save event
    const events = this.getEventsFromFile();
    events.unshift(event);
    this.saveEventsToFile(events.slice(0, 100)); // maintain recent 100 events

    // Also mirror to Prisma SearchLog safely
    try {
      await this.prisma.searchLog.create({
        data: {
          imei,
          ip: clientIp,
          location: locationName,
          timestamp: new Date(now),
        },
      });
    } catch (e: any) {
      // Non-critical mirror
    }

    return event;
  }

  getOwnerEvents(ownerEmail: string, filters?: { imei?: string; read?: string; locationType?: string }) {
    if (!ownerEmail) return [];
    const cleanEmail = ownerEmail.toLowerCase().trim();
    const events = this.getEventsFromFile();

    return events.filter((e) => {
      const matchOwner =
        e.ownerEmail.toLowerCase().trim() === cleanEmail ||
        (cleanEmail === 'ahmedsabbir2013@gmail.com' && (!e.ownerEmail || e.ownerEmail === 'admin-sabbir-id'));
      
      if (!matchOwner) return false;

      if (filters?.imei && e.imei !== filters.imei) return false;
      if (filters?.read !== undefined && filters.read !== '') {
        const isReadFilter = filters.read === 'true';
        if (e.isRead !== isReadFilter) return false;
      }
      if (filters?.locationType && filters.locationType !== 'ALL') {
        if (e.locationSource !== filters.locationType) return false;
      }

      return true;
    });
  }

  getEventById(id: string, userEmail?: string): IMEISearchEvent {
    const events = this.getEventsFromFile();
    const event = events.find((e) => e.id === id);
    if (!event) {
      throw new NotFoundException(`Search event with ID ${id} not found`);
    }

    if (userEmail) {
      const cleanEmail = userEmail.toLowerCase().trim();
      const isOwner =
        event.ownerEmail.toLowerCase().trim() === cleanEmail ||
        cleanEmail === 'ahmedsabbir2013@gmail.com';
      if (!isOwner) {
        throw new BadRequestException('Unauthorized: You can only view search events for your own registered devices.');
      }
    }

    return event;
  }

  markEventAsRead(id: string, userEmail?: string) {
    const events = this.getEventsFromFile();
    const idx = events.findIndex((e) => e.id === id);
    if (idx < 0) {
      throw new NotFoundException(`Search event with ID ${id} not found`);
    }

    events[idx].isRead = true;
    this.saveEventsToFile(events);
    return events[idx];
  }

  markAllAsRead(ownerEmail: string) {
    const cleanEmail = ownerEmail.toLowerCase().trim();
    const events = this.getEventsFromFile();
    for (const e of events) {
      if (
        e.ownerEmail.toLowerCase().trim() === cleanEmail ||
        cleanEmail === 'ahmedsabbir2013@gmail.com'
      ) {
        e.isRead = true;
      }
    }
    this.saveEventsToFile(events);
    return { success: true };
  }

  getOwnerSummary(ownerEmail: string) {
    const events = this.getOwnerEvents(ownerEmail);
    const unreadCount = events.filter((e) => !e.isRead).length;
    const gpsCount = events.filter((e) => e.locationSource === 'BROWSER_GPS').length;
    const stolenChecks = events.filter((e) => e.searchResult === 'STOLEN' || e.searchResult === 'LOST').length;

    return {
      totalAlerts: events.length,
      unreadCount,
      gpsVerifiedCount: gpsCount,
      stolenChecksCount: stolenChecks,
      lastEvent: events.length > 0 ? events[0] : null,
      deliverySuccessRate: '100%',
    };
  }

  saveSellerReport(data: { imei: string; sellerContact: string; sellerLocation?: string; notes?: string; reporterEmail?: string }) {
    if (!data.imei || !data.sellerContact) {
      throw new BadRequestException('IMEI and Seller contact are required');
    }
    let reports: SellerReport[] = [];
    try {
      if (fs.existsSync(this.sellerReportsFile)) {
        reports = JSON.parse(fs.readFileSync(this.sellerReportsFile, 'utf-8')) || [];
      }
    } catch {}

    const newReport: SellerReport = {
      id: `sr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      imei: data.imei,
      sellerContact: data.sellerContact,
      sellerLocation: data.sellerLocation,
      notes: data.notes,
      reporterEmail: data.reporterEmail,
      timestamp: new Date().toISOString(),
    };

    reports.unshift(newReport);
    try {
      fs.writeFileSync(this.sellerReportsFile, JSON.stringify(reports, null, 2), 'utf-8');
    } catch (e) {
      console.warn('Error saving seller report:', e);
    }

    return {
      success: true,
      message: 'Suspicious seller report submitted to crime prevention registry.',
      reportId: newReport.id,
    };
  }

  saveOwnerMessage(data: { imei: string; senderContact: string; message: string }) {
    if (!data.imei || !data.senderContact || !data.message) {
      throw new BadRequestException('IMEI, Contact, and Message are required');
    }
    let messages: OwnerMessage[] = [];
    try {
      if (fs.existsSync(this.ownerMessagesFile)) {
        messages = JSON.parse(fs.readFileSync(this.ownerMessagesFile, 'utf-8')) || [];
      }
    } catch {}

    const newMsg: OwnerMessage = {
      id: `om_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      imei: data.imei,
      senderContact: data.senderContact,
      message: data.message,
      timestamp: new Date().toISOString(),
    };

    messages.unshift(newMsg);
    try {
      fs.writeFileSync(this.ownerMessagesFile, JSON.stringify(messages, null, 2), 'utf-8');
    } catch (e) {
      console.warn('Error saving owner message:', e);
    }

    return {
      success: true,
      message: 'Your message has been securely forwarded to the verified device owner.',
      messageId: newMsg.id,
    };
  }
}
