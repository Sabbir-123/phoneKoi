import { Controller, Post, Body, Req, Get, Query, ForbiddenException } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../auth/public.decorator';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('submit')
  async submitReport(@Body() body: any, @Req() req: any) {
    const forwarded = req.headers['x-forwarded-for'];
    const ip =
      typeof forwarded === 'string'
        ? forwarded.split(',')[0].trim()
        : req.socket?.remoteAddress || '127.0.0.1';

    const callerEmail = req.user?.email || body.email;
    const userId = req.user?.id;

    return this.reportsService.submitReport({
      imei: body.imei,
      ip,
      location: body.location,
      description: body.description,
      contactNumber: body.contactNumber,
      deviceName: body.deviceName,
      brand: body.brand,
      model: body.model,
      reportType: body.reportType || 'STOLEN',
      lossDate: body.lossDate,
      policeGdNumber: body.policeGdNumber,
      policeStation: body.policeStation,
      notificationPreferences: body.notificationPreferences,
      extractedFromGd: body.extractedFromGd,
      aiExtractionConfidence: body.aiExtractionConfidence,
      userId: userId,
      email: callerEmail,
      trustWeight: body.extractedFromGd ? 5 : req.user ? 2 : 1,
      gdImage: body.gdImage,
    });
  }

  @Throttle({ default: { limit: 4, ttl: 60000 } })
  @Post('extract-gd')
  async extractGd(@Body('base64Image') base64Image: string) {
    return this.reportsService.extractInfoFromGd(base64Image);
  }

  @Get()
  async getReports(@Query('email') email: string, @Req() req: any) {
    const caller = req.user;
    if (!caller) {
      throw new ForbiddenException('Authentication required to access reports');
    }

    // Admins can see all reports or filter by email; normal users can ONLY see their own reports
    const targetEmail =
      caller.role === 'ADMIN'
        ? email || undefined
        : caller.email;

    return this.reportsService.getReports(targetEmail);
  }
}
