import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AlertDispatcherService } from './alert-dispatcher.service';

@Injectable()
export class TelegramBotService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramBotService.name);
  private isPolling = false;
  private shouldStop = false;
  private lastUpdateId = 0;
  private pollingTimeout: NodeJS.Timeout | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly alertDispatcher: AlertDispatcherService,
  ) {}

  async onModuleInit() {
    // Start polling in background
    this.startPollingLoop();
  }

  onModuleDestroy() {
    this.shouldStop = true;
    if (this.pollingTimeout) {
      clearTimeout(this.pollingTimeout);
      this.pollingTimeout = null;
    }
  }

  /**
   * Continuous background polling to receive Telegram commands & deep-link starts
   */
  private async startPollingLoop() {
    if (this.isPolling) return;
    this.isPolling = true;

    const poll = async () => {
      if (this.shouldStop) {
        this.isPolling = false;
        return;
      }

      try {
        const config = await this.alertDispatcher.getGatewaysConfig();
        const botToken = config.telegram?.botToken;

        if (config.telegram?.enabled && botToken && !botToken.includes('...')) {
          await this.fetchAndProcessUpdates(botToken);
        }
      } catch (err: any) {
        // Log sparingly to avoid spamming logs on network hiccups
        if (!err?.message?.includes('ETIMEDOUT') && !err?.message?.includes('timeout')) {
          this.logger.debug(`Telegram poll cycle error: ${err?.message || err}`);
        }
      }

      // Schedule next poll
      if (!this.shouldStop) {
        this.pollingTimeout = setTimeout(poll, 3000);
      } else {
        this.isPolling = false;
      }
    };

    poll();
  }

  /**
   * Fetch updates from Telegram getUpdates API
   */
  async fetchAndProcessUpdates(botToken: string) {
    const url = `https://api.telegram.org/bot${botToken}/getUpdates?offset=${this.lastUpdateId ? this.lastUpdateId + 1 : 0}&timeout=5`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
      const res = await fetch(url, { signal: controller.signal });
      const data = await res.json().catch(() => null);

      if (res.ok && data?.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          this.lastUpdateId = Math.max(this.lastUpdateId, update.update_id);
          await this.handleSingleUpdate(botToken, update);
        }
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Process a single Telegram update (from polling or webhook)
   */
  async handleSingleUpdate(botToken: string, update: any) {
    const message = update?.message;
    if (!message || !message.text) return;

    const chatId = String(message.chat?.id || '');
    const text = message.text.trim();
    const senderName = message.from?.first_name || message.from?.username || 'User';

    if (!chatId) return;

    this.logger.log(`Telegram Bot received message from ${chatId} (@${message.from?.username || 'unknown'}): ${text}`);

    // 1. Handle /start command (including deep link /start connect_<userId>)
    if (text.startsWith('/start')) {
      const parts = text.split(/\s+/);
      const param = parts[1]; // e.g. "connect_d290f1ee-6c54-4b01-90e6-d701748f0851" or "user_..."

      if (param) {
        let userId = param;
        if (userId.startsWith('connect_')) userId = userId.replace('connect_', '');
        if (userId.startsWith('user_')) userId = userId.replace('user_', '');

        // Find user by ID in database
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
        });

        if (user) {
          // Link this Telegram chat ID to the user
          await this.prisma.user.update({
            where: { id: user.id },
            data: { telegramChatId: chatId },
          });

          await this.alertDispatcher.sendTelegramMessage(
            botToken,
            chatId,
            `🎉 *PhoneKoi Account Linked Successfully!*\n\n` +
            `Hello *${user.displayName || senderName}*! Your Telegram is now connected to PhoneKoi (${user.email || user.phone}).\n\n` +
            `🛡️ *Active Security:* Whenever an IMEI query is performed on your reported device, you will receive real-time push alerts with GPS coordinates, IP address, and location details directly here.`
          );
          return;
        } else {
          await this.alertDispatcher.sendTelegramMessage(
            botToken,
            chatId,
            `⚠️ *Linking Error*\n\n` +
            `We could not find a PhoneKoi account for token \`${param}\`.\n\n` +
            `Please log in to your PhoneKoi dashboard at https://phone-koi.vercel.app and click *Connect Telegram in 1-Click* on your Alerts page.`
          );
          return;
        }
      }

      // Plain /start without deep link parameter
      await this.alertDispatcher.sendTelegramMessage(
        botToken,
        chatId,
        `👋 *Welcome to PhoneKoi Security Alert Bot!*\n\n` +
        `Your Telegram Chat ID: \`${chatId}\` _(tap to copy)_\n\n` +
        `🔗 *1-Click Auto Connect:*\n` +
        `Log in to your PhoneKoi dashboard (https://phone-koi.vercel.app/dashboard/alerts) and click *"Connect Telegram in 1-Click"* to connect automatically!\n\n` +
        `💡 *Or Link by Command:*\n` +
        `Send \`/link your-email@example.com\` to connect with your registered email address.`
      );
      return;
    }

    // 2. Handle /link <email_or_phone>
    if (text.startsWith('/link')) {
      const parts = text.split(/\s+/);
      const target = parts[1]?.trim();

      if (!target) {
        await this.alertDispatcher.sendTelegramMessage(
          botToken,
          chatId,
          `ℹ️ *How to link:* Send \`/link your-email@example.com\` or click *"Connect Telegram in 1-Click"* on your PhoneKoi dashboard.`
        );
        return;
      }

      const user = await this.prisma.user.findFirst({
        where: {
          OR: [
            { email: { equals: target, mode: 'insensitive' } },
            { phone: target },
            { normalizedPhone: target },
          ],
        },
      });

      if (user) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { telegramChatId: chatId },
        });

        await this.alertDispatcher.sendTelegramMessage(
          botToken,
          chatId,
          `✅ *PhoneKoi Account Linked!*\n\nConnected to *${user.displayName || user.email || user.phone}*. You will now receive security alerts directly here.`
        );
      } else {
        await this.alertDispatcher.sendTelegramMessage(
          botToken,
          chatId,
          `❌ *No Account Found*\n\nCould not find a PhoneKoi account with: \`${target}\`.\nPlease check spelling or connect via your dashboard at https://phone-koi.vercel.app.`
        );
      }
      return;
    }

    // 3. Handle /myid
    if (text === '/myid' || text === '/id') {
      await this.alertDispatcher.sendTelegramMessage(
        botToken,
        chatId,
        `🆔 Your Telegram Chat ID is: \`${chatId}\``
      );
      return;
    }

    // 4. Handle /unlink
    if (text === '/unlink') {
      await this.prisma.user.updateMany({
        where: { telegramChatId: chatId },
        data: { telegramChatId: null },
      });
      await this.alertDispatcher.sendTelegramMessage(
        botToken,
        chatId,
        `👋 Your Telegram has been unlinked from PhoneKoi security alerts.`
      );
      return;
    }
  }
}
