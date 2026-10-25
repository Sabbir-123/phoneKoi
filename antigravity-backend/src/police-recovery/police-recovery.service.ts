import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { AlertDispatcherService } from '../notifications/alert-dispatcher.service';
import { CreatePoliceRecoveryDriveDto } from './dto/create-drive.dto';
import { ExtractDocumentDto, ExtractUrlDto } from './dto/extract-drive.dto';

@Injectable()
export class PoliceRecoveryService {
  private readonly logger = new Logger(PoliceRecoveryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly alertDispatcher: AlertDispatcherService,
  ) {}

  /**
   * Fetches article/press release from URL and parses recovered phones using Gemini AI
   */
  async extractFromUrl(dto: ExtractUrlDto) {
    const { url } = dto;
    if (!url || !url.startsWith('http')) {
      throw new BadRequestException('A valid HTTP/HTTPS URL is required');
    }

    try {
      this.logger.log(`Fetching police recovery URL: ${url}`);
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      if (!res.ok) {
        throw new BadRequestException(`Failed to fetch URL. HTTP status: ${res.status}`);
      }

      const html = await res.text();

      // Clean HTML to pure text to save context tokens and focus on content
      const cleanedText = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, ' ')
        .trim();

      // Limit to ~50,000 chars which is more than enough for press releases and tables
      const contentSnippet = cleanedText.slice(0, 50000);

      const extracted = await this.aiService.extractPoliceRecoveryData({ text: contentSnippet });
      return {
        ...extracted,
        sourceUrl: url,
      };
    } catch (err: any) {
      this.logger.error(`Error extracting police drive from URL: ${err?.message || err}`);
      throw new BadRequestException(`AI Extraction Failed: ${err?.message || err}`);
    }
  }

  /**
   * Extracts police recovery data from uploaded PDF/image or raw text
   */
  async extractFromDocument(dto: ExtractDocumentDto) {
    if (!dto.text && !dto.base64File) {
      throw new BadRequestException('Either text or base64File must be provided');
    }

    try {
      const extracted = await this.aiService.extractPoliceRecoveryData({
        text: dto.text,
        base64File: dto.base64File,
        mimeType: dto.mimeType || 'application/pdf',
      });
      return extracted;
    } catch (err: any) {
      this.logger.error(`Error extracting from document: ${err?.message || err}`);
      throw new BadRequestException(`Document OCR & Extraction Failed: ${err?.message || err}`);
    }
  }

  /**
   * Saves verified recovery drive and devices into database, cross-referencing previously reported stolen IMEIs
   */
  async createDrive(dto: CreatePoliceRecoveryDriveDto, adminUser?: any) {
    if (!dto.title || !dto.agency || !dto.devices || dto.devices.length === 0) {
      throw new BadRequestException('Title, agency, and at least 1 recovered device are required');
    }

    let parsedDriveDate: Date = new Date();
    if (dto.driveDate) {
      const parsed = new Date(dto.driveDate);
      if (!isNaN(parsed.getTime())) {
        parsedDriveDate = parsed;
      }
    }

    // 1. Transaction to create drive and all recovered devices
    const createdDrive = await this.prisma.$transaction(async (tx) => {
      const drive = await tx.policeRecoveryDrive.create({
        data: {
          title: dto.title,
          agency: dto.agency,
          policeStation: dto.policeStation || null,
          caseNumber: dto.caseNumber || null,
          officerName: dto.officerName || null,
          officerContact: dto.officerContact || null,
          mediaContact: dto.mediaContact || null,
          claimInstructions: dto.claimInstructions || null,
          sourceUrl: dto.sourceUrl || null,
          driveDate: parsedDriveDate,
          totalDevices: dto.devices.length,
        },
      });

      const devicesData = dto.devices
        .filter((d) => d.imei1 || d.imei2 || d.brand)
        .map((d) => ({
          driveId: drive.id,
          brand: d.brand || 'Unknown',
          model: d.model || 'Unknown',
          imei1: d.imei1 ? String(d.imei1).replace(/\D/g, '').slice(0, 16) : null,
          imei2: d.imei2 ? String(d.imei2).replace(/\D/g, '').slice(0, 16) : null,
          serialNumber: d.serialNumber || null,
          rawText: d.rawText || null,
          status: 'IN_CUSTODY' as const,
        }));

      if (devicesData.length > 0) {
        await tx.recoveredDevice.createMany({
          data: devicesData,
        });
      }

      return drive;
    });

    // 2. Cross-reference matched stolen reports in the system
    const recoveredImeis: string[] = [];
    dto.devices.forEach((d) => {
      if (d.imei1) recoveredImeis.push(d.imei1.replace(/\D/g, ''));
      if (d.imei2) recoveredImeis.push(d.imei2.replace(/\D/g, ''));
    });

    const uniqueRecoveredImeis = Array.from(new Set(recoveredImeis.filter((i) => i.length >= 14)));

    let matchedReports: any[] = [];
    if (uniqueRecoveredImeis.length > 0) {
      try {
        matchedReports = await this.prisma.report.findMany({
          where: {
            imei: { in: uniqueRecoveredImeis },
            status: { in: ['APPROVED', 'PENDING'] },
          },
          include: {
            user: true,
          },
        });

        // Trigger celebratory alerts to matched owners
        for (const report of matchedReports) {
          const matchedDevice = dto.devices.find(
            (d) =>
              (d.imei1 && d.imei1.replace(/\D/g, '') === report.imei) ||
              (d.imei2 && d.imei2.replace(/\D/g, '') === report.imei),
          );

          this.alertDispatcher.sendPoliceRecoveryAlert({
            ownerEmail: report.userEmail || report.user?.email,
            ownerTelegramChatId: report.telegramChatId || report.user?.telegramChatId,
            ownerPhone: report.contactNumber || report.user?.phone,
            device: {
              brand: report.brand || matchedDevice?.brand,
              model: report.model || matchedDevice?.model,
              imei1: report.imei,
              imei2: matchedDevice?.imei2,
            },
            drive: {
              title: createdDrive.title,
              agency: createdDrive.agency,
              policeStation: createdDrive.policeStation || undefined,
              caseNumber: createdDrive.caseNumber || undefined,
              officerName: createdDrive.officerName || undefined,
              officerContact: createdDrive.officerContact || undefined,
              claimInstructions: createdDrive.claimInstructions || undefined,
              sourceUrl: createdDrive.sourceUrl || undefined,
            },
          }).catch((err) => {
            this.logger.warn(`Failed to dispatch recovery alert for report ${report.id}: ${err?.message}`);
          });
        }
      } catch (matchErr: any) {
        this.logger.error(`Error cross-referencing stolen reports: ${matchErr?.message || matchErr}`);
      }
    }

    return {
      success: true,
      drive: createdDrive,
      totalDevices: dto.devices.length,
      matchedReportsCount: matchedReports.length,
      matchedReports: matchedReports.map((r) => ({
        reportId: r.id,
        imei: r.imei,
        deviceName: r.deviceName,
        userEmail: r.userEmail,
      })),
    };
  }

  /**
   * Search specifically for recovered devices by IMEI
   */
  async searchRecovered(imei: string) {
    const cleanImei = String(imei).replace(/\D/g, '');
    if (cleanImei.length < 14) {
      throw new BadRequestException('A valid 14-16 digit IMEI is required');
    }

    const device = await this.prisma.recoveredDevice.findFirst({
      where: {
        OR: [{ imei1: cleanImei }, { imei2: cleanImei }],
      },
      include: {
        drive: true,
      },
    });

    if (!device) {
      return {
        found: false,
        message: 'No record found in police recovered devices database.',
      };
    }

    return {
      found: true,
      device: {
        id: device.id,
        brand: device.brand,
        model: device.model,
        imei1: device.imei1,
        imei2: device.imei2,
        status: device.status,
      },
      drive: {
        id: device.drive.id,
        title: device.drive.title,
        agency: device.drive.agency,
        policeStation: device.drive.policeStation,
        caseNumber: device.drive.caseNumber,
        officerName: device.drive.officerName,
        officerContact: device.drive.officerContact,
        mediaContact: device.drive.mediaContact,
        claimInstructions: device.drive.claimInstructions,
        sourceUrl: device.drive.sourceUrl,
        driveDate: device.drive.driveDate,
      },
    };
  }

  /**
   * List all published recovery drives with pagination and search
   */
  async getDrives(page = 1, limit = 10, search?: string) {
    const skip = (Math.max(1, page) - 1) * limit;

    const where: any = {};
    if (search && search.trim()) {
      where.OR = [
        { title: { contains: search.trim(), mode: 'insensitive' } },
        { agency: { contains: search.trim(), mode: 'insensitive' } },
        { policeStation: { contains: search.trim(), mode: 'insensitive' } },
        { caseNumber: { contains: search.trim(), mode: 'insensitive' } },
        { officerName: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const [total, drives] = await Promise.all([
      this.prisma.policeRecoveryDrive.count({ where }),
      this.prisma.policeRecoveryDrive.findMany({
        where,
        skip,
        take: limit,
        orderBy: { driveDate: 'desc' },
      }),
    ]);

    return {
      drives: drives.map((d) => ({
        id: d.id,
        title: d.title,
        agency: d.agency,
        policeStation: d.policeStation,
        caseNumber: d.caseNumber,
        officerName: d.officerName,
        officerContact: d.officerContact,
        mediaContact: d.mediaContact,
        claimInstructions: d.claimInstructions,
        sourceUrl: d.sourceUrl,
        driveDate: d.driveDate,
        createdAt: d.createdAt,
        deviceCount: d.totalDevices,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get single drive by ID with all its recovered devices
   */
  async getDriveById(id: string) {
    const drive = await this.prisma.policeRecoveryDrive.findUnique({
      where: { id },
      include: {
        devices: {
          orderBy: { brand: 'asc' },
        },
      },
    });

    if (!drive) {
      throw new NotFoundException('Recovery drive not found');
    }

    return drive;
  }

  /**
   * Delete recovery drive and all its devices
   */
  async deleteDrive(id: string) {
    const drive = await this.prisma.policeRecoveryDrive.findUnique({ where: { id } });
    if (!drive) throw new NotFoundException('Recovery drive not found');

    await this.prisma.policeRecoveryDrive.delete({
      where: { id },
    });

    return { success: true, message: 'Recovery drive and all devices deleted successfully' };
  }
}
