import { Controller, Post, Body, Req, Get } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('submit')
  async submitReport(@Body() body: any, @Req() req: any) {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    return this.reportsService.submitReport({
      imei: body.imei,
      ip,
      location: body.location,
      description: body.description,
      contactNumber: body.contactNumber,
      deviceName: body.deviceName,
      extractedFromGd: body.extractedFromGd,
      aiExtractionConfidence: body.aiExtractionConfidence,
      userId: req.user?.id, // Optional user from auth middleware (if implemented)
      trustWeight: body.extractedFromGd ? 5 : (req.user ? 2 : 1)
    });
  }

  @Post('extract-gd')
  async extractGd(@Body('base64Image') base64Image: string) {
    return this.reportsService.extractInfoFromGd(base64Image);
  }

  @Get()
  async getReports() {
    return this.reportsService.getAllReports();
  }
}
