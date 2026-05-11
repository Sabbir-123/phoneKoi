import { Controller, Get, Req } from '@nestjs/common';
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
}
