import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReportsService } from '../reports/reports.service';
import * as fs from 'fs';
import * as path from 'path';

export interface SubscriptionItem {
  id: string;
  userId: string;
  userEmail: string;
  planName: string;
  price: number;
  trxCode: string;
  bkashLastFour: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class AdminService {
  private dataDir = path.join(process.cwd(), 'data');
  private subFile = path.join(process.cwd(), 'data', 'subscriptions.json');

  constructor(
    private prisma: PrismaService,
    private reportsService: ReportsService,
  ) {}

  private getSubscriptionsFromFile(): SubscriptionItem[] {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      if (fs.existsSync(this.subFile)) {
        const raw = fs.readFileSync(this.subFile, 'utf-8');
        return JSON.parse(raw) || [];
      }
    } catch (e) {
      console.warn('Could not read subscriptions from file:', e);
    }
    return [];
  }

  private saveSubscriptionsToFile(subs: SubscriptionItem[]) {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      fs.writeFileSync(this.subFile, JSON.stringify(subs, null, 2), 'utf-8');
    } catch (e) {
      console.warn('Could not write subscriptions to file:', e);
    }
  }

  async getAllSubscriptionRequests() {
    let dbRequests: any[] = [];
    try {
      dbRequests = await this.prisma.subscriptionRequest.findMany({
        orderBy: { createdAt: 'desc' }
      });
    } catch (e: any) {
      console.warn('Prisma getAllSubscriptionRequests error, using file store:', e?.message || e);
    }

    const localRequests = this.getSubscriptionsFromFile();
    const map = new Map<string, any>();
    for (const r of dbRequests) {
      map.set(r.id, r);
    }
    for (const r of localRequests) {
      if (!map.has(r.id)) {
        map.set(r.id, r);
      }
    }

    return Array.from(map.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async approveSubscriptionRequest(id: string) {
    let request: any = null;
    try {
      request = await this.prisma.subscriptionRequest.findUnique({
        where: { id }
      });
    } catch (e) {
      console.warn('Prisma findUnique subscription error:', e);
    }

    if (!request) {
      const localSubs = this.getSubscriptionsFromFile();
      request = localSubs.find(s => s.id === id);
    }

    if (!request) {
      throw new NotFoundException(`Subscription request with ID ${id} not found`);
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException(`Subscription request is already ${request.status}`);
    }

    // Determine plan quotas
    let months = 1;
    let searches = 3;
    let reportQuota = 2; // ৳49/1 Month -> 2 mobile reports

    if (request.planName.toLowerCase().includes('3 month')) {
      months = 3;
      searches = 15;
      reportQuota = 4; // ৳99/3 Months -> 4 mobile reports
    } else if (request.planName.toLowerCase().includes('6 month')) {
      months = 6;
      searches = 30;
      reportQuota = 10; // ৳259/6 Months -> 10 mobile reports
    } else if (request.planName.toLowerCase().includes('12 month') || request.planName.toLowerCase().includes('1 year')) {
      months = 12;
      searches = 99;
      reportQuota = 50; // ৳999/12 Months -> 50 mobile reports
    }

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + months);

    // Try Prisma transaction
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.subscriptionRequest.update({
          where: { id },
          data: { status: 'APPROVED' }
        });

        await tx.user.update({
          where: { id: request.userId },
          data: {
            plan: 'PRO',
            isPro: true,
            searchLimit: searches,
            searchesLeft: searches,
            reportLimit: reportQuota,
            reportsLeft: reportQuota,
            subscriptionExpiresAt: expiresAt
          }
        });
      });
    } catch (e: any) {
      console.warn('Prisma approveSubscriptionRequest transaction failed, updating local state:', e?.message || e);
    }

    // Update local subscriptions store
    const localSubs = this.getSubscriptionsFromFile();
    const idx = localSubs.findIndex(s => s.id === id);
    const now = new Date().toISOString();
    if (idx >= 0) {
      localSubs[idx].status = 'APPROVED';
      localSubs[idx].updatedAt = now;
      request = localSubs[idx];
    } else {
      request.status = 'APPROVED';
      request.updatedAt = now;
      localSubs.unshift(request);
    }
    this.saveSubscriptionsToFile(localSubs);

    return request;
  }

  async rejectSubscriptionRequest(id: string) {
    let request: any = null;
    try {
      request = await this.prisma.subscriptionRequest.findUnique({
        where: { id }
      });
    } catch (e) {
      console.warn('Prisma findUnique subscription error:', e);
    }

    if (!request) {
      const localSubs = this.getSubscriptionsFromFile();
      request = localSubs.find(s => s.id === id);
    }

    if (!request) {
      throw new NotFoundException(`Subscription request with ID ${id} not found`);
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException(`Subscription request is already ${request.status}`);
    }

    try {
      await this.prisma.subscriptionRequest.update({
        where: { id },
        data: { status: 'REJECTED' }
      });
    } catch (e: any) {
      console.warn('Prisma reject subscription error:', e?.message || e);
    }

    const localSubs = this.getSubscriptionsFromFile();
    const idx = localSubs.findIndex(s => s.id === id);
    const now = new Date().toISOString();
    if (idx >= 0) {
      localSubs[idx].status = 'REJECTED';
      localSubs[idx].updatedAt = now;
      request = localSubs[idx];
    } else {
      request.status = 'REJECTED';
      request.updatedAt = now;
      localSubs.unshift(request);
    }
    this.saveSubscriptionsToFile(localSubs);

    return request;
  }

  async getAllDeviceReports() {
    let dbReports: any[] = [];
    try {
      dbReports = await this.prisma.report.findMany({
        orderBy: { createdAt: 'desc' }
      });
    } catch (e: any) {
      console.warn('Prisma getAllDeviceReports failed:', e?.message || e);
    }

    const localReports = this.reportsService.getReportsFromFile();
    const map = new Map<string, any>();
    for (const r of dbReports) {
      map.set(r.id, r);
    }
    for (const r of localReports) {
      if (!map.has(r.id)) {
        map.set(r.id, r);
      }
    }

    return Array.from(map.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async approveDeviceReport(id: string) {
    let report: any = null;
    try {
      report = await this.prisma.report.findUnique({
        where: { id }
      });
    } catch (e: any) {
      console.warn('Prisma findUnique report error:', e?.message || e);
    }

    if (!report) {
      const localReports = this.reportsService.getReportsFromFile();
      report = localReports.find(r => r.id === id);
    }

    if (!report) {
      throw new NotFoundException(`Device report with ID ${id} not found`);
    }

    if (report.status === 'APPROVED') {
      throw new BadRequestException(`Report is already ${report.status}`);
    }

    // Try Prisma transaction
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.report.update({
          where: { id },
          data: { status: 'APPROVED' }
        });

        await tx.device.update({
          where: { imei: report.imei },
          data: {
            status: 'STOLEN',
            riskScore: 98,
            riskLevel: 'HIGH'
          }
        });
      });
    } catch (e: any) {
      console.warn('Prisma approveDeviceReport error, using local fallback:', e?.message || e);
    }

    // Update local reports store
    const localReports = this.reportsService.getReportsFromFile();
    const now = new Date().toISOString();
    const repIdx = localReports.findIndex(r => r.id === id);
    if (repIdx >= 0) {
      localReports[repIdx].status = 'APPROVED';
      localReports[repIdx].updatedAt = now;
      report = localReports[repIdx];
    } else {
      report.status = 'APPROVED';
      report.updatedAt = now;
      localReports.unshift(report);
    }
    this.reportsService.saveReportsToFile(localReports);

    // Update local devices store
    const localDevices = this.reportsService.getDevicesFromFile();
    const devIdx = localDevices.findIndex(d => d.imei === report.imei);
    if (devIdx >= 0) {
      localDevices[devIdx].status = 'STOLEN';
      localDevices[devIdx].riskScore = 98;
      localDevices[devIdx].riskLevel = 'HIGH';
      localDevices[devIdx].updatedAt = now;
    } else {
      localDevices.push({
        imei: report.imei,
        status: 'STOLEN',
        riskScore: 98,
        riskLevel: 'HIGH',
        createdAt: now,
        updatedAt: now
      });
    }
    this.reportsService.saveDevicesToFile(localDevices);

    return report;
  }

  async rejectDeviceReport(id: string) {
    let report: any = null;
    try {
      report = await this.prisma.report.findUnique({
        where: { id }
      });
    } catch (e: any) {
      console.warn('Prisma findUnique report error:', e?.message || e);
    }

    if (!report) {
      const localReports = this.reportsService.getReportsFromFile();
      report = localReports.find(r => r.id === id);
    }

    if (!report) {
      throw new NotFoundException(`Device report with ID ${id} not found`);
    }

    if (report.status === 'REJECTED') {
      throw new BadRequestException(`Report is already ${report.status}`);
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.report.update({
          where: { id },
          data: { status: 'REJECTED' }
        });

        const otherApprovedReports = await tx.report.count({
          where: {
            imei: report.imei,
            status: 'APPROVED'
          }
        });

        if (otherApprovedReports === 0) {
          await tx.device.update({
            where: { imei: report.imei },
            data: {
              status: 'CLEAN',
              riskScore: 0,
              riskLevel: 'LOW'
            }
          });
        }
      });
    } catch (e: any) {
      console.warn('Prisma rejectDeviceReport error, using local fallback:', e?.message || e);
    }

    const localReports = this.reportsService.getReportsFromFile();
    const now = new Date().toISOString();
    const repIdx = localReports.findIndex(r => r.id === id);
    if (repIdx >= 0) {
      localReports[repIdx].status = 'REJECTED';
      localReports[repIdx].updatedAt = now;
      report = localReports[repIdx];
    } else {
      report.status = 'REJECTED';
      report.updatedAt = now;
      localReports.unshift(report);
    }
    this.reportsService.saveReportsToFile(localReports);

    // Check if other approved reports exist in local store for this IMEI
    const otherApproved = localReports.some(r => r.imei === report.imei && r.status === 'APPROVED');
    if (!otherApproved) {
      const localDevices = this.reportsService.getDevicesFromFile();
      const devIdx = localDevices.findIndex(d => d.imei === report.imei);
      if (devIdx >= 0) {
        localDevices[devIdx].status = 'CLEAN';
        localDevices[devIdx].riskScore = 0;
        localDevices[devIdx].riskLevel = 'LOW';
        localDevices[devIdx].updatedAt = now;
        this.reportsService.saveDevicesToFile(localDevices);
      }
    }

    return report;
  }
}
