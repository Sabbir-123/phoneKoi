import { Controller, Get, Post, Req, Body, Query, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { Throttle } from '@nestjs/throttler';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateSubscriptionRequestDto } from './dto/subscription-request.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me/insights')
  async getInsights(@Req() req: any) {
    const caller = req.user;
    if (!caller) {
      throw new ForbiddenException('Authentication required to access insights');
    }
    return this.usersService.getUserInsights(caller.id, caller.email);
  }

  @Get('me/search-history')
  async getSearchHistory(@Req() req: any) {
    const caller = req.user;
    if (!caller) {
      throw new ForbiddenException('Authentication required to access search history');
    }
    return this.usersService.getUserSearchHistory(caller.email);
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

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Get('check-phone')
  async checkPhone(
    @Query('phone') phone: string,
    @Req() req: any,
  ) {
    if (!phone) {
      return { available: false, message: 'Phone number is required' };
    }
    const caller = req.user;
    if (!caller) {
      throw new ForbiddenException('Authentication required');
    }
    return this.usersService.checkPhoneAvailability(phone, caller.email);
  }

  @Post('profile')
  async updateProfile(
    @Body() dto: UpdateProfileDto,
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
    @Body() dto: CreateSubscriptionRequestDto,
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

  @Post('link-telegram')
  async linkTelegram(
    @Body() body: { telegramChatId: string },
    @Req() req: any,
  ) {
    const caller = req.user;
    if (!caller) {
      throw new ForbiddenException('Authentication required');
    }
    return this.usersService.linkTelegramChatId(caller.email, body.telegramChatId);
  }

  @Post('test-telegram')
  async testTelegram(@Req() req: any) {
    const caller = req.user;
    if (!caller) {
      throw new ForbiddenException('Authentication required');
    }
    return this.usersService.testUserTelegram(caller.email);
  }
}

