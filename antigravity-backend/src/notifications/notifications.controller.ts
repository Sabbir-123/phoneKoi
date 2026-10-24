import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { TelegramBotService } from './telegram-bot.service';
import { AlertDispatcherService } from './alert-dispatcher.service';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly telegramBotService: TelegramBotService,
    private readonly alertDispatcher: AlertDispatcherService,
  ) {}

  /**
   * Telegram Webhook endpoint (for production deployment)
   */
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
