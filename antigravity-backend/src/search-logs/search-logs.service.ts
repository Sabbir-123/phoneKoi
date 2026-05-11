import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as geoip from 'geoip-lite';

@Injectable()
export class SearchLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async logSearch(imei: string, ip: string) {
    const geo = geoip.lookup(ip);
    const location = geo ? `${geo.city}, ${geo.country}` : 'Unknown';

    // Upsert the device first (so it exists)
    await this.prisma.device.upsert({
      where: { imei },
      update: {},
      create: { imei }
    });

    await this.prisma.searchLog.create({
      data: {
        imei,
        ip,
        location,
      }
    });
  }
}
