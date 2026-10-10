import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { UsersService } from '../users/users.service';
import * as fs from 'fs';
import * as path from 'path';

export interface DeviceReportItem {
  id: string;
  imei: string;
  reporterIp?: string;
  location?: string;
  description?: string;
  contactNumber?: string;
  deviceName?: string;
  extractedFromGd?: boolean;
  aiExtractionConfidence?: number;
  userId?: string;
  userEmail?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  trustWeight?: number;
  gdImage?: string | null;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceStoreItem {
  imei: string;
  status: 'CLEAN' | 'SUSPICIOUS' | 'STOLEN';
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class ReportsService {
  private dataDir = path.join(process.cwd(), 'data');
  private reportsFile = path.join(process.cwd(), 'data', 'reports.json');
  private devicesFile = path.join(process.cwd(), 'data', 'devices.json');

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly usersService: UsersService,
  ) {}

  getReportsFromFile(): DeviceReportItem[] {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      if (fs.existsSync(this.reportsFile)) {
        const raw = fs.readFileSync(this.reportsFile, 'utf-8');
        return JSON.parse(raw) || [];
      }
    } catch (e) {
      console.warn('Could not read reports from file store:', e);
    }
    return [];
  }

  saveReportsToFile(reports: DeviceReportItem[]) {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      fs.writeFileSync(this.reportsFile, JSON.stringify(reports, null, 2), 'utf-8');
    } catch (e) {
      console.warn('Could not save reports to file store:', e);
    }
  }

  getDevicesFromFile(): DeviceStoreItem[] {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      if (fs.existsSync(this.devicesFile)) {
        const raw = fs.readFileSync(this.devicesFile, 'utf-8');
        return JSON.parse(raw) || [];
      }
    } catch (e) {
      console.warn('Could not read devices from file store:', e);
    }
    return [];
  }

  saveDevicesToFile(devices: DeviceStoreItem[]) {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      fs.writeFileSync(this.devicesFile, JSON.stringify(devices, null, 2), 'utf-8');
    } catch (e) {
      console.warn('Could not save devices to file store:', e);
    }
  }

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
      throw new BadRequestException('Invalid IMEI format. IMEI must be 15 digits.');
    }

    // 1. Rate Limiting Check (within last 24h)
    let recentReportsCount = 0;
    try {
      recentReportsCount = await this.prisma.report.count({
        where: {
          reporterIp: data.ip,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      });
    } catch (err: any) {
      const localReports = this.getReportsFromFile();
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      recentReportsCount = localReports.filter(r => r.reporterIp === data.ip && new Date(r.createdAt).getTime() >= oneDayAgo).length;
    }

    if (recentReportsCount > 10) {
      throw new BadRequestException('Rate limit exceeded for reports from this IP');
    }

    // 2. Fetch User Profile & Quotas using UsersService
    let userRecord: any = null;
    if (data.email) {
      try {
        userRecord = await this.usersService.getUserProfile(data.email);
      } catch (err: any) {
        console.warn('Error fetching user profile in submitReport:', err?.message || err);
      }
    }

    // Determine authorization:
    const isAdmin = userRecord && (userRecord.role === 'ADMIN' || userRecord.email === 'ahmedsabbir2013@gmail.com');
    const isPro = userRecord && (isAdmin || userRecord.isPro || userRecord.plan === 'PRO' || (typeof userRecord.plan === 'string' && userRecord.plan.includes('Pro')));

    if (!isAdmin) {
      if (!userRecord || !isPro || (userRecord.reportsLeft !== undefined && userRecord.reportsLeft <= 0)) {
        throw new BadRequestException('Reporting is strictly restricted to premium accounts with active quotas. Please purchase a package.');
      }
    }

    const finalUserId = userRecord ? userRecord.id : (data.userId || 'offline-user-id');
    let savedReport: any = null;

    // 3. Try persisting to Prisma DB first
    try {
      await this.prisma.device.upsert({
        where: { imei: data.imei },
        update: {},
        create: { imei: data.imei }
      });

      savedReport = await this.prisma.$transaction(async (tx) => {
        const newReport = await tx.report.create({
          data: {
            imei: data.imei,
            reporterIp: data.ip,
            location: data.location || '',
            description: data.description,
            contactNumber: data.contactNumber,
            deviceName: data.deviceName,
            extractedFromGd: data.extractedFromGd || false,
            aiExtractionConfidence: data.aiExtractionConfidence,
            userId: finalUserId,
            trustWeight: data.trustWeight || 1,
            gdImage: data.gdImage,
            status: 'PENDING'
          }
        });

        if (userRecord && userRecord.id && !['admin-sabbir-id', 'offline-user-id'].includes(userRecord.id)) {
          await tx.user.update({
            where: { id: userRecord.id },
            data: {
              reportsLeft: {
                decrement: 1
              }
            }
          });
        }

        return newReport;
      });
    } catch (dbErr: any) {
      console.warn('Database connection unavailable for report, using local storage:', dbErr?.message || dbErr);
    }

    // 4. Fallback in-memory/JSON store object if database is unreachable
    const nowStr = new Date().toISOString();
    if (!savedReport) {
      savedReport = {
        id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        imei: data.imei,
        reporterIp: data.ip,
        location: data.location || '',
        description: data.description || '',
        contactNumber: data.contactNumber || '',
        deviceName: data.deviceName || '',
        extractedFromGd: data.extractedFromGd || false,
        aiExtractionConfidence: data.aiExtractionConfidence || 0.85,
        userId: finalUserId,
        userEmail: data.email || userRecord?.email || '',
        trustWeight: data.trustWeight || 1,
        gdImage: data.gdImage || null,
        status: 'PENDING',
        date: nowStr,
        createdAt: nowStr,
        updatedAt: nowStr
      };
    }

    // 5. Always persist to local persistent store so data is immediately saved and durable
    const localReports = this.getReportsFromFile();
    const existingIdx = localReports.findIndex(r => r.id === savedReport.id);
    const reportItem: DeviceReportItem = {
      id: savedReport.id,
      imei: savedReport.imei,
      reporterIp: savedReport.reporterIp || data.ip,
      location: savedReport.location || data.location || '',
      description: savedReport.description || data.description || '',
      contactNumber: savedReport.contactNumber || data.contactNumber || '',
      deviceName: savedReport.deviceName || data.deviceName || '',
      extractedFromGd: Boolean(savedReport.extractedFromGd),
      aiExtractionConfidence: savedReport.aiExtractionConfidence || data.aiExtractionConfidence || 0.85,
      userId: savedReport.userId || finalUserId,
      userEmail: data.email || userRecord?.email || '',
      status: (savedReport.status as any) || 'PENDING',
      trustWeight: savedReport.trustWeight || data.trustWeight || 1,
      gdImage: savedReport.gdImage || data.gdImage || null,
      date: savedReport.date ? new Date(savedReport.date).toISOString() : nowStr,
      createdAt: savedReport.createdAt ? new Date(savedReport.createdAt).toISOString() : nowStr,
      updatedAt: savedReport.updatedAt ? new Date(savedReport.updatedAt).toISOString() : nowStr
    };

    if (existingIdx >= 0) {
      localReports[existingIdx] = reportItem;
    } else {
      localReports.unshift(reportItem);
    }
    this.saveReportsToFile(localReports);

    // Ensure device is registered in local devices.json
    const localDevices = this.getDevicesFromFile();
    const devIdx = localDevices.findIndex(d => d.imei === data.imei);
    if (devIdx < 0) {
      localDevices.push({
        imei: data.imei,
        status: 'CLEAN',
        riskScore: 0,
        riskLevel: 'LOW',
        createdAt: nowStr,
        updatedAt: nowStr
      });
      this.saveDevicesToFile(localDevices);
    }

    return savedReport;
  }

  async extractInfoFromGd(base64Image: string) {
    if (!base64Image) {
      throw new BadRequestException('Image data is required');
    }
    return this.aiService.extractInfoFromGd(base64Image);
  }

  async getReports(email?: string) {
    let dbReports: any[] = [];
    try {
      if (email) {
        const user = await this.prisma.user.findUnique({
          where: { email }
        });
        if (user) {
          dbReports = await this.prisma.report.findMany({
            where: { userId: user.id },
            orderBy: {
              createdAt: 'desc'
            }
          });
        }
      } else {
        dbReports = await this.prisma.report.findMany({
          orderBy: {
            createdAt: 'desc'
          }
        });
      }
    } catch (err: any) {
      console.warn('Database getReports unavailable, using local file store:', err?.message || err);
    }

    const localReports = this.getReportsFromFile();
    const map = new Map<string, any>();
    for (const r of dbReports) {
      map.set(r.id, r);
    }
    for (const r of localReports) {
      if (!map.has(r.id)) {
        map.set(r.id, r);
      }
    }

    let allReports = Array.from(map.values());

    if (email) {
      const cleanEmail = email.toLowerCase().trim();
      allReports = allReports.filter(r => {
        if (r.userEmail && r.userEmail.toLowerCase().trim() === cleanEmail) return true;
        if (cleanEmail === 'ahmedsabbir2013@gmail.com' && (r.userId === 'admin-sabbir-id' || !r.userEmail)) return true;
        return false;
      });
    }

    return allReports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}
