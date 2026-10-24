import { Controller, Post, Get, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { TelegramBotService } from './telegram-bot.service';
import { AlertDispatcherService } from './alert-dispatcher.service';
import { Public } from '../auth/public.decorator';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly telegramBotService: TelegramBotService,
    private readonly alertDispatcher: AlertDispatcherService,
  ) {}

  /**
   * Public endpoint to get which notification channels are enabled by Admin
   */
  @Public()
  @Get('active-channels')
  async getActiveChannels() {
    return this.alertDispatcher.getActiveChannels();
  }

  /**
   * Telegram Webhook endpoint (for production deployment)
   */
  @Public()
  @Post('telegram/webhook')
  @HttpCode(HttpStatus.OK)
  async handleTelegramWebhook(@Body() update: any) {
    const config = await this.alertDispatcher.getGatewaysConfig();
    const botToken = config.telegram?.botToken;
    if (botToken && !botToken.includes('...')) {
      await this.telegramBotService.handleSingleUpdate(botToken, update);
    }
    return { ok: true };
  }
}
