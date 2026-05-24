import { Controller, Get, Post, Req, Body, Query } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me/insights')
  async getInsights(@Req() req: any) {
    // Mock user ID for now
    const userId = 'mock-user-id';
    return this.usersService.getUserInsights(userId);
  }

  @Get('profile')
  async getProfile(@Query('email') email: string) {
    return this.usersService.getUserProfile(email || 'ahmedsabbir2013@gmail.com');
  }

  @Post('subscription-request')
  async createRequest(
    @Query('email') email: string,
    @Body() dto: { planName: string, price: number, trxCode: string, bkashLastFour: string }
  ) {
    return this.usersService.createSubscriptionRequest(email || 'ahmedsabbir2013@gmail.com', dto);
  }

  @Get('alerts')
  async getAlerts(@Query('email') email: string) {
    return this.usersService.getUserAlerts(email || 'ahmedsabbir2013@gmail.com');
  }
}
