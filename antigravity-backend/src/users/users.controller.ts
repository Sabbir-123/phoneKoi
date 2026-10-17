import { Controller, Get, Post, Req, Body, Query, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { Public } from '../auth/public.decorator';
import { Throttle } from '@nestjs/throttler';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me/insights')
  async getInsights(@Req() req: any) {
    const userId = req.user?.id || 'mock-user-id';
    return this.usersService.getUserInsights(userId);
  }

  @Get('profile')
  async getProfile(@Query('email') email: string, @Req() req: any) {
    const caller = req.user;
    if (!caller) {
      throw new ForbiddenException('Authentication required');
    }

    // Allow admin to view any user profile, otherwise strictly enforce own profile
    const targetEmail =
      caller.role === 'ADMIN' && email
        ? email.toLowerCase().trim()
        : caller.email;

    return this.usersService.getUserProfile(targetEmail);
  }

  @Public()
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @Get('check-phone')
  async checkPhone(@Query('phone') phone: string, @Query('email') email: string) {
    if (!phone) {
      return { available: false, message: 'Phone number is required' };
    }
    return this.usersService.checkPhoneAvailability(phone, email);
  }

  @Post('profile')
  async updateProfile(
    @Body() dto: { phone: string; whatsapp?: string; address?: string; displayName?: string; avatar?: string },
    @Req() req: any,
  ) {
    const caller = req.user;
    if (!caller) {
      throw new ForbiddenException('Authentication required');
    }

    // Strictly enforce updating caller's own profile
    return this.usersService.updateUserProfile(caller.email, dto);
  }


  @Post('subscription-request')
  async createRequest(
    @Body() dto: { planName: string; price: number; trxCode: string; bkashLastFour: string },
    @Req() req: any,
  ) {
    const caller = req.user;
    if (!caller) {
      throw new ForbiddenException('Authentication required');
    }
    return this.usersService.createSubscriptionRequest(caller.email, dto);
  }

  @Get('alerts')
  async getAlerts(@Req() req: any) {
    const caller = req.user;
    if (!caller) {
      throw new ForbiddenException('Authentication required');
    }
    return this.usersService.getUserAlerts(caller.email);
  }
}
