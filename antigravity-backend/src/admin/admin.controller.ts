import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { AdminService } from './admin.service';
import { Roles } from '../auth/roles.decorator';

@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('subscription-requests')
  async getRequests() {
    return this.adminService.getAllSubscriptionRequests();
  }

  @Post('subscription-requests/:id/approve')
  async approveRequest(@Param('id') id: string) {
    return this.adminService.approveSubscriptionRequest(id);
  }

  @Post('subscription-requests/:id/reject')
  async rejectRequest(@Param('id') id: string) {
    return this.adminService.rejectSubscriptionRequest(id);
  }

  @Get('reports')
  async getDeviceReports() {
    return this.adminService.getAllDeviceReports();
  }

  @Post('reports/:id/approve')
  async approveReport(@Param('id') id: string) {
    return this.adminService.approveDeviceReport(id);
  }

  @Get('settings/gateways')
  async getGatewaySettings() {
    return this.adminService.getGatewaySettings();
  }

  @Post('settings/gateways')
  async updateGatewaySettings(@Body() body: any) {
    return this.adminService.updateGatewaySettings(body);
  }

  @Post('settings/gateways/test')
  async testGatewayChannel(@Body() body: { channel: 'TELEGRAM' | 'EMAIL' | 'WHATSAPP' | 'SMS'; recipient: string; configOverride?: any }) {
    return this.adminService.testGatewayChannel(body.channel, body.recipient, body.configOverride);
  }
}

