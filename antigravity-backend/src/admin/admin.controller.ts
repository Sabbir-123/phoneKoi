import { Controller, Get, Post, Param } from '@nestjs/common';
import { AdminService } from './admin.service';

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

  @Post('reports/:id/reject')
  async rejectReport(@Param('id') id: string) {
    return this.adminService.rejectDeviceReport(id);
  }
}
