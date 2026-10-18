import { Controller, Get, Param, Query, Req, BadRequestException } from '@nestjs/common';
import { ImeiService } from './imei.service';
import { Public } from '../auth/public.decorator';
import { Throttle } from '@nestjs/throttler';

@Controller('imei')
export class ImeiController {
  constructor(private readonly imeiService: ImeiService) {}

  @Public()
  @Throttle({ default: { limit: 12, ttl: 60000 } })
  @Get('check/:imei')
  async checkImei(
    @Param('imei') imei: string,
    @Query('lang') lang: 'english' | 'banglish',
    @Query('email') email: string,
    @Query('clientIp') clientIp: string,
    @Query('clientLocation') clientLocation: string,
    @Req() req: any,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('accuracy') accuracy?: string,
    @Query('locationSource') locationSource?: string,
  ) {
    if (!imei) throw new BadRequestException('IMEI is required');

    // Trusted IP resolution
    const forwarded = req.headers['x-forwarded-for'];
    const realIp =
      typeof forwarded === 'string'
        ? forwarded.split(',')[0].trim()
        : req.socket?.remoteAddress || req.connection?.remoteAddress || '127.0.0.1';

    // Only allow clientIp query param in development for localhost testing
    const isDev = process.env.NODE_ENV !== 'production';
    const ip = isDev && clientIp ? clientIp : realIp;

    // Strictly rely on verified authenticated token for quota-associated user accounts
    const verifiedEmail = req.user?.email || undefined;
    const language = lang === 'banglish' ? 'banglish' : 'english';

    return this.imeiService.checkImei(
      imei,
      ip,
      language,
      verifiedEmail,
      clientLocation,
      lat ? parseFloat(lat) : undefined,
      lng ? parseFloat(lng) : undefined,
      accuracy ? parseFloat(accuracy) : undefined,
      locationSource as any,
      req.user,
    );
  }
}
