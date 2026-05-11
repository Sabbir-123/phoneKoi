import { Controller, Get, Param, Query, Req, BadRequestException } from '@nestjs/common';
import { ImeiService } from './imei.service';

@Controller('imei')
export class ImeiController {
  constructor(private readonly imeiService: ImeiService) {}

  @Get('check/:imei')
  async checkImei(
    @Param('imei') imei: string, 
    @Query('lang') lang: 'english' | 'banglish',
    @Req() req: any
  ) {
    if (!imei) throw new BadRequestException('IMEI is required');
    
    // Get IP address for search logging
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const language = lang === 'banglish' ? 'banglish' : 'english';
    
    return this.imeiService.checkImei(imei, ip, language);
  }
}
