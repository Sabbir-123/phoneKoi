import { Controller, Post, Body, Req } from '@nestjs/common';
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
      userId: req.user?.id, // Optional user from auth middleware (if implemented)
      trustWeight: req.user ? 2 : 1 // Simple trust scoring, 2 if user, 1 if anonymous
    });
  }
}
