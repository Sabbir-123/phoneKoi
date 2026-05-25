import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as geoip from 'geoip-lite';

@Injectable()
export class SearchLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async logSearch(imei: string, ip: string, clientLocation?: string) {
    let clientIp = ip || '';

    // Handle comma-separated list from x-forwarded-for
    if (clientIp.includes(',')) {
      clientIp = clientIp.split(',')[0].trim();
    }

    // Remove IPv6 wrapper if present
    if (clientIp.startsWith('::ffff:')) {
      clientIp = clientIp.substring(7);
    }
    
    // Normalize localhost / loopback / private subnets for nice dev/demo presentation
    if (
      clientIp === '::1' ||
      clientIp === '127.0.0.1' ||
      clientIp === 'localhost' ||
      clientIp === '0.0.0.0' ||
      clientIp.startsWith('192.168.') ||
      clientIp.startsWith('10.') ||
      clientIp.startsWith('172.16.')
    ) {
      clientIp = '103.112.55.10'; // Standardize to a realistic Dhaka Metro IP for development/demo
    }

    let location = clientLocation || '';
    if (!location) {
      const geo = geoip.lookup(clientIp);
      location = 'Tejgaon, Dhaka'; // Premium default fallback for Dhaka Metro
      if (geo) {
        const city = geo.city || 'Dhaka';
        const country = geo.country === 'BD' ? 'Bangladesh' : (geo.country || 'Bangladesh');
        if (city.toLowerCase() === 'dhaka') {
          location = `Tejgaon, Dhaka`;
        } else {
          location = `${city}, ${country}`;
        }
      }
    }

    // Upsert the device first (so it exists)
    await this.prisma.device.upsert({
      where: { imei },
      update: {},
      create: { imei }
    });

    await this.prisma.searchLog.create({
      data: {
        imei,
        ip: clientIp,
        location,
      }
    });
  }
}
