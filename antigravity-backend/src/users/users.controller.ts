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
    if (!email) {
      return null;
    }
    return this.usersService.getUserProfile(email);
  }

  @Get('check-phone')
  async checkPhone(@Query('phone') phone: string, @Query('email') email: string) {
    if (!phone) {
      return { available: false, message: 'Phone number is required' };
    }
    return this.usersService.checkPhoneAvailability(phone, email);
  }

  @Post('profile')
  async updateProfile(
    @Body() dto: { email: string; phone: string; whatsapp?: string; address?: string; displayName?: string; avatar?: string }
  ) {
    return this.usersService.updateUserProfile(dto.email, dto);
  }

  @Post('subscription-request')
  async createRequest(
    @Query('email') email: string,
    @Body() dto: { planName: string, price: number, trxCode: string, bkashLastFour: string }
  ) {
    if (!email) {
      return null;
    }
    return this.usersService.createSubscriptionRequest(email, dto);
  }

  @Get('alerts')
  async getAlerts(@Query('email') email: string) {
    if (!email) {
      return [];
    }
    return this.usersService.getUserAlerts(email);
  }
}
