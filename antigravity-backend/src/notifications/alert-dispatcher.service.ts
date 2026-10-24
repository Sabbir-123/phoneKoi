import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Resend } from 'resend';
import {
  NotificationGatewaysConfig,
  SearchAlertPayload,
  DeliveryChannelStatus,
} from './notifications.types';

const GATEWAYS_SETTING_KEY = 'NOTIFICATION_GATEWAYS';

@Injectable()
export class AlertDispatcherService {
  private readonly logger = new Logger(AlertDispatcherService.name);
  private cachedConfig: NotificationGatewaysConfig | null = null;
  private configExpiresAt = 0;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves the current gateways configuration (with fallback defaults from env)
   */
  async getGatewaysConfig(): Promise<NotificationGatewaysConfig> {
    const now = Date.now();
    if (this.cachedConfig && this.configExpiresAt > now) {
      return this.cachedConfig;
    }

    try {
      const setting = await this.prisma.systemSetting.findUnique({
        where: { key: GATEWAYS_SETTING_KEY },
      });

      if (setting && setting.value) {
        this.cachedConfig = setting.value as unknown as NotificationGatewaysConfig;
        this.configExpiresAt = now + 10000;
        return this.cachedConfig;
      }
    } catch (err: any) {
      this.logger.warn(`Could not fetch system setting ${GATEWAYS_SETTING_KEY}: ${err?.message || err}`);
    }

    // Default configuration from environment variables if set
    const defaultConfig: NotificationGatewaysConfig = {
      telegram: {
        enabled: Boolean(process.env.TELEGRAM_BOT_TOKEN),
        botToken: process.env.TELEGRAM_BOT_TOKEN || '',
        botUsername: process.env.TELEGRAM_BOT_USERNAME || 'PhoneKoiAlertBot',
        adminChatId: process.env.TELEGRAM_ADMIN_CHAT_ID || '',
      },
      email: {
        enabled: Boolean(process.env.RESEND_API_KEY),
        provider: 'RESEND',
        resendApiKey: process.env.RESEND_API_KEY || '',
        fromEmail: process.env.RESEND_FROM_EMAIL || 'PhoneKoi Alerts <alerts@phonekoi.com>',
      },
      whatsapp: {
        enabled: false,
        provider: 'ULTRAMSG',
        instanceId: process.env.WHATSAPP_INSTANCE_ID || '',
        token: process.env.WHATSAPP_TOKEN || '',
        senderNumber: process.env.WHATSAPP_SENDER_NUMBER || '',
      },
      sms: {
        enabled: false,
        provider: 'GREENWEB',
        apiKey: process.env.SMS_API_KEY || '',
        senderId: process.env.SMS_SENDER_ID || '',
      },
    };

    this.cachedConfig = defaultConfig;
    this.configExpiresAt = now + 10000;
    return defaultConfig;
  }

  /**
   * Updates gateways configuration in database and invalidates cache
   */
  async updateGatewaysConfig(newConfig: NotificationGatewaysConfig): Promise<NotificationGatewaysConfig> {
    await this.prisma.systemSetting.upsert({
      where: { key: GATEWAYS_SETTING_KEY },
      update: {
        value: newConfig as any,
      },
      create: {
        key: GATEWAYS_SETTING_KEY,
        value: newConfig as any,
      },
    });

    this.cachedConfig = newConfig;
    this.configExpiresAt = Date.now() + 10000;
    return newConfig;
  }

  /**
   * Returns sanitized config for admin UI display (masks secrets)
   */
  async getMaskedConfigForAdmin(): Promise<any> {
    const cfg = await this.getGatewaysConfig();
    return {
      telegram: {
        ...cfg.telegram,
        botToken: this.maskSecret(cfg.telegram?.botToken),
      },
      email: {
        ...cfg.email,
        resendApiKey: this.maskSecret(cfg.email?.resendApiKey),
        emailjsPrivateKey: this.maskSecret(cfg.email?.emailjsPrivateKey),
      },
      whatsapp: {
        ...cfg.whatsapp,
        token: this.maskSecret(cfg.whatsapp?.token),
      },
      sms: {
        ...cfg.sms,
        apiKey: this.maskSecret(cfg.sms?.apiKey),
        clientSecret: this.maskSecret(cfg.sms?.clientSecret),
      },
    };
  }

  private maskSecret(val?: string): string {
    if (!val || val.length <= 6) return val || '';
    return `${val.substring(0, 4)}...${val.substring(val.length - 3)}`;
  }

  /**
   * Main Dispatcher: Called when an IMEI is searched
   */
  async dispatchSearchAlert(payload: SearchAlertPayload): Promise<DeliveryChannelStatus[]> {
    const config = await this.getGatewaysConfig();
    const nowIso = new Date().toISOString();
    const results: DeliveryChannelStatus[] = [
      { channel: 'IN_APP', status: 'DELIVERED', deliveredAt: nowIso },
    ];

    // 1. Telegram Dispatch
    if (config.telegram?.enabled && config.telegram.botToken) {
      try {
        const recipients: string[] = [];
        if (payload.ownerTelegramChatId) recipients.push(payload.ownerTelegramChatId);
        if (config.telegram.adminChatId) recipients.push(config.telegram.adminChatId);

        if (recipients.length > 0) {
          const mapLink = payload.latitude && payload.longitude
            ? `https://www.google.com/maps?q=${payload.latitude},${payload.longitude}`
            : null;

          const text = [
            `🚨 *PhoneKoi Security Alert!*`,
            `--------------------------------`,
            `Your reported *${payload.deviceBrand || ''} ${payload.deviceModel || 'device'}* was just searched in the PhoneKoi Registry.`,
            ``,
            `📱 *Device:* ${payload.deviceName || 'Mobile Device'}`,
            `🔢 *IMEI:* \`${payload.maskedImei}\``,
            `⏰ *Time:* ${payload.timestamp.toLocaleString('en-US', { timeZone: 'Asia/Dhaka' })} (BST)`,
            `🌐 *IP Address:* \`${payload.ip || 'Unknown'}\``,
            `📍 *Approximate Location:* ${payload.locationName || 'Unknown'}`,
            payload.policeGdNumber ? `📋 *Police GD:* ${payload.policeGdNumber}` : '',
            mapLink ? `\n🗺️ [View on Google Maps](${mapLink})` : '',
            ``,
            `🔐 Track full live telemetry in your [PhoneKoi Dashboard](https://phone-koi.vercel.app/dashboard/alerts).`,
          ].filter(Boolean).join('\n');

          for (const chatId of Array.from(new Set(recipients))) {
            await this.sendTelegramMessage(config.telegram.botToken, chatId, text);
          }

          results.push({
            channel: 'TELEGRAM',
            status: 'DELIVERED',
            detail: `Sent to ${recipients.length} chat(s)`,
            deliveredAt: nowIso,
          });
        } else {
          results.push({
            channel: 'TELEGRAM',
            status: 'SKIPPED',
            detail: 'No Telegram Chat ID linked to device owner',
            deliveredAt: nowIso,
          });
        }
      } catch (err: any) {
        this.logger.error(`Telegram alert failed: ${err?.message || err}`);
        results.push({
          channel: 'TELEGRAM',
          status: 'FAILED',
          detail: err?.message,
          deliveredAt: nowIso,
        });
      }
    }

    // 2. Email Dispatch (Resend)
    if (config.email?.enabled && payload.ownerEmail) {
      try {
        if (config.email.provider === 'RESEND' && config.email.resendApiKey) {
          await this.sendResendEmail(config.email.resendApiKey, config.email.fromEmail || 'PhoneKoi Alerts <alerts@phonekoi.com>', payload.ownerEmail, payload);
          results.push({ channel: 'EMAIL', status: 'DELIVERED', deliveredAt: nowIso });
        } else {
          results.push({ channel: 'EMAIL', status: 'SKIPPED', detail: 'Email provider not configured', deliveredAt: nowIso });
        }
      } catch (err: any) {
        this.logger.error(`Email alert failed: ${err?.message || err}`);
        results.push({ channel: 'EMAIL', status: 'FAILED', detail: err?.message, deliveredAt: nowIso });
      }
    }

    // 3. WhatsApp Dispatch
    if (config.whatsapp?.enabled && (payload.ownerWhatsapp || payload.ownerPhone)) {
      try {
        const targetNumber = payload.ownerWhatsapp || payload.ownerPhone || '';
        await this.sendWhatsAppAlert(config.whatsapp, targetNumber, payload);
        results.push({ channel: 'WHATSAPP', status: 'DELIVERED', deliveredAt: nowIso });
      } catch (err: any) {
        this.logger.error(`WhatsApp alert failed: ${err?.message || err}`);
        results.push({ channel: 'WHATSAPP', status: 'FAILED', detail: err?.message, deliveredAt: nowIso });
      }
    }

    // 4. Emergency SMS Dispatch
    if (config.sms?.enabled && payload.ownerPhone) {
      try {
        await this.sendSmsAlert(config.sms, payload.ownerPhone, payload);
        results.push({ channel: 'SMS', status: 'DELIVERED', deliveredAt: nowIso });
      } catch (err: any) {
        this.logger.error(`SMS alert failed: ${err?.message || err}`);
        results.push({ channel: 'SMS', status: 'FAILED', detail: err?.message, deliveredAt: nowIso });
      }
    }

    return results;
  }

  // --- Gateway Drivers ---

  async sendTelegramMessage(botToken: string, chatId: string, text: string): Promise<boolean> {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
        disable_web_page_preview: false,
      }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
      if (data?.description?.includes('chat not found')) {
        throw new Error(
          `Telegram Chat Not Found: The recipient (${chatId}) has not started the bot yet. Please open the bot on Telegram and tap "Start" (/start), then try again.`
        );
      }
      if (data?.description?.includes('bot was blocked')) {
        throw new Error(`Telegram Error: The bot was blocked by user ${chatId}. Please unblock the bot on Telegram.`);
      }
      throw new Error(`Telegram API Error: ${data?.description || res.statusText}`);
    }
    return true;
  }

  async sendResendEmail(apiKey: string, fromEmail: string, toEmail: string, payload: SearchAlertPayload): Promise<boolean> {
    const resend = new Resend(apiKey);
    const timeFormatted = payload.timestamp.toLocaleString('en-US', { timeZone: 'Asia/Dhaka' });
    const mapLink = payload.latitude && payload.longitude
      ? `https://www.google.com/maps?q=${payload.latitude},${payload.longitude}`
      : null;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 18px 24px; border-radius: 12px; color: #ffffff; text-align: center;">
          <h2 style="margin: 0; font-size: 20px;">🚨 PhoneKoi Security Alert!</h2>
          <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">Someone just searched for your lost/stolen device</p>
        </div>

        <div style="padding: 24px 0;">
          <p style="font-size: 14px; color: #334155; line-height: 1.6;">
            A query was executed against the PhoneKoi database for your registered device:
          </p>

          <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin: 16px 0;">
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; color: #64748b;"><strong>Device:</strong></td>
              <td style="padding: 8px 0; color: #0f172a; font-weight: bold;">${payload.deviceName || 'Mobile Device'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; color: #64748b;"><strong>Masked IMEI:</strong></td>
              <td style="padding: 8px 0; color: #0f172a; font-family: monospace;">${payload.maskedImei}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; color: #64748b;"><strong>Detection Time:</strong></td>
              <td style="padding: 8px 0; color: #0f172a;">${timeFormatted} (BST)</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; color: #64748b;"><strong>Searcher IP:</strong></td>
              <td style="padding: 8px 0; color: #0f172a; font-family: monospace;">${payload.ip || 'Unknown'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; color: #64748b;"><strong>Approximate Location:</strong></td>
              <td style="padding: 8px 0; color: #0f172a;">${payload.locationName || 'Location unavailable'}</td>
            </tr>
          </table>

          ${mapLink ? `
            <div style="text-align: center; margin: 24px 0;">
              <a href="${mapLink}" style="background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
                🗺️ View Search Location on Map
              </a>
            </div>
          ` : ''}

          <div style="background-color: #f8fafc; border-left: 4px solid #4f46e5; padding: 12px 16px; border-radius: 6px; font-size: 12px; color: #475569; margin-top: 20px;">
            <strong>Next Steps:</strong> If this search was not conducted by you or local law enforcement, please review your <a href="https://phone-koi.vercel.app/dashboard/alerts" style="color: #4f46e5;">PhoneKoi Alerts Dashboard</a> and keep your Police GD record handy.
          </div>
        </div>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #94a3b8; text-align: center;">
          PhoneKoi National IMEI Registry & Anti-Theft Defense System. Bangladesh.
        </div>
      </div>
    `;

    const { error } = await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      subject: `🚨 Alert: Search detected for your ${payload.deviceBrand || ''} ${payload.deviceModel || 'device'} (IMEI: ${payload.maskedImei})`,
      html,
    });

    if (error) {
      if (error.message?.includes('domain is not verified')) {
        throw new Error(
          `Domain unverified on Resend: Change "From Address" to "PhoneKoi Alerts <onboarding@resend.dev>" for instant testing, or verify phonekoi.com on resend.com/domains.`
        );
      }
      if (error.message?.includes('testing emails to your own email address')) {
        const match = error.message.match(/\(([^)]+)\)/);
        const allowedEmail = match ? match[1] : 'your Resend registration email';
        throw new Error(
          `Resend Sandbox Limit: In test mode, you can only send to your Resend account email: ${allowedEmail}. Please enter ${allowedEmail} in the test box.`
        );
      }
      throw new Error(`Resend Error: ${error.message}`);
    }
    return true;
  }

  async sendWhatsAppAlert(whatsappConfig: NotificationGatewaysConfig['whatsapp'], toPhone: string, payload: SearchAlertPayload): Promise<boolean> {
    const cleanPhone = toPhone.replace(/[^0-9]/g, '');
    const msg = `🚨 *PhoneKoi Alert!* Your reported device (${payload.deviceBrand || ''} ${payload.deviceModel || 'Phone'}, IMEI: ${payload.maskedImei}) was just searched on PhoneKoi.\nLocation: ${payload.locationName || 'Unknown'}\nIP: ${payload.ip || 'Unknown'}\nCheck your dashboard: https://phone-koi.vercel.app/dashboard/alerts`;

    if (whatsappConfig.provider === 'ULTRAMSG') {
      const url = `https://api.ultramsg.com/${whatsappConfig.instanceId}/messages/chat`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          token: whatsappConfig.token || '',
          to: cleanPhone.startsWith('88') ? cleanPhone : `88${cleanPhone}`,
          body: msg,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || data?.error) throw new Error(data?.error || res.statusText);
      return true;
    }

    if (whatsappConfig.provider === 'GREENAPI') {
      const url = `https://api.green-api.com/waInstance${whatsappConfig.instanceId}/sendMessage/${whatsappConfig.token}`;
      const recipientChat = `${cleanPhone.startsWith('88') ? cleanPhone : `88${cleanPhone}`}@c.us`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: recipientChat, message: msg }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || data?.error) throw new Error(data?.error || res.statusText);
      return true;
    }

    throw new Error(`Unsupported WhatsApp provider: ${whatsappConfig.provider}`);
  }

  async sendSmsAlert(smsConfig: NotificationGatewaysConfig['sms'], toPhone: string, payload: SearchAlertPayload): Promise<boolean> {
    const cleanPhone = toPhone.replace(/[^0-9]/g, '');
    const bdPhone = cleanPhone.startsWith('88') ? cleanPhone : `88${cleanPhone}`;
    const msg = `PhoneKoi Alert: Your reported ${payload.deviceBrand || ''} ${payload.deviceModel || 'Phone'} (IMEI: ${payload.maskedImei}) was searched in our system. Check dashboard: phone-koi.vercel.app`;

    if (smsConfig.provider === 'GREENWEB') {
      const url = `https://api.greenweb.com.bd/api.php?token=${encodeURIComponent(smsConfig.apiKey || '')}&to=${encodeURIComponent(bdPhone)}&message=${encodeURIComponent(msg)}`;
      const res = await fetch(url);
      const data = await res.text();
      if (!res.ok || data.includes('Error')) throw new Error(data);
      return true;
    }

    if (smsConfig.provider === 'BULKSMS_BD') {
      const url = `http://bulksmsbd.net/api/smsapi?api_key=${encodeURIComponent(smsConfig.apiKey || '')}&type=text&number=${encodeURIComponent(bdPhone)}&senderid=${encodeURIComponent(smsConfig.senderId || '')}&message=${encodeURIComponent(msg)}`;
      const res = await fetch(url);
      const data = await res.text();
      if (!res.ok) throw new Error(data);
      return true;
    }

    throw new Error(`Unsupported SMS provider: ${smsConfig.provider}`);
  }

  /**
   * Helper for testing a gateway directly from Admin UI
   */
  async testChannel(channel: 'TELEGRAM' | 'EMAIL' | 'WHATSAPP' | 'SMS', recipient: string, overrideConfig?: any): Promise<{ success: boolean; message: string }> {
    try {
      const baseConfig = await this.getGatewaysConfig();
      const config: NotificationGatewaysConfig = {
        telegram: {
          enabled: overrideConfig?.telegram?.enabled ?? baseConfig.telegram.enabled,
          botToken: (overrideConfig?.telegram?.botToken && !overrideConfig.telegram.botToken.includes('...'))
            ? overrideConfig.telegram.botToken
            : baseConfig.telegram.botToken,
          botUsername: overrideConfig?.telegram?.botUsername || baseConfig.telegram.botUsername,
          adminChatId: overrideConfig?.telegram?.adminChatId ?? baseConfig.telegram.adminChatId,
        },
        email: {
          enabled: overrideConfig?.email?.enabled ?? baseConfig.email.enabled,
          provider: overrideConfig?.email?.provider || baseConfig.email.provider,
          resendApiKey: (overrideConfig?.email?.resendApiKey && !overrideConfig.email.resendApiKey.includes('...'))
            ? overrideConfig.email.resendApiKey
            : baseConfig.email.resendApiKey,
          fromEmail: overrideConfig?.email?.fromEmail || baseConfig.email.fromEmail,
        },
        whatsapp: {
          enabled: overrideConfig?.whatsapp?.enabled ?? baseConfig.whatsapp.enabled,
          provider: overrideConfig?.whatsapp?.provider || baseConfig.whatsapp.provider,
          instanceId: overrideConfig?.whatsapp?.instanceId ?? baseConfig.whatsapp.instanceId,
          token: (overrideConfig?.whatsapp?.token && !overrideConfig.whatsapp.token.includes('...'))
            ? overrideConfig.whatsapp.token
            : baseConfig.whatsapp.token,
          senderNumber: overrideConfig?.whatsapp?.senderNumber ?? baseConfig.whatsapp.senderNumber,
        },
        sms: {
          enabled: overrideConfig?.sms?.enabled ?? baseConfig.sms.enabled,
          provider: overrideConfig?.sms?.provider || baseConfig.sms.provider,
          apiKey: (overrideConfig?.sms?.apiKey && !overrideConfig.sms.apiKey.includes('...'))
            ? overrideConfig.sms.apiKey
            : baseConfig.sms.apiKey,
          senderId: overrideConfig?.sms?.senderId ?? baseConfig.sms.senderId,
          clientSecret: (overrideConfig?.sms?.clientSecret && !overrideConfig.sms.clientSecret.includes('...'))
            ? overrideConfig.sms.clientSecret
            : baseConfig.sms.clientSecret,
        },
      };

      const samplePayload: SearchAlertPayload = {
        imei: '358066149534298',
        maskedImei: '358066******298',
        deviceName: 'iPhone 15 Pro Max (Test)',
        deviceBrand: 'Apple',
        deviceModel: 'iPhone 15 Pro Max',
        searchResult: 'STOLEN',
        timestamp: new Date(),
        ip: '103.145.118.25',
        latitude: 23.8103,
        longitude: 90.4125,
        locationName: 'Uttara, Dhaka (GPS Verified)',
        policeGdNumber: 'GD-9942/2026',
      };

      if (channel === 'TELEGRAM') {
        const botToken = config.telegram?.botToken;
        if (!botToken) return { success: false, message: 'Telegram Bot Token is required' };
        const testChatId = recipient || config.telegram?.adminChatId;
        if (!testChatId) return { success: false, message: 'Target Telegram Chat ID is required' };
        await this.sendTelegramMessage(
          botToken,
          testChatId,
          `✅ *PhoneKoi Telegram Bot Connected!*\n\nYour alert system is operational. Whenever a stolen IMEI is searched, you will receive real-time telemetry here.`
        );
        return { success: true, message: `Test Telegram message delivered to Chat ID: ${testChatId}` };
      }

      if (channel === 'EMAIL') {
        const apiKey = config.email?.resendApiKey;
        if (!apiKey) return { success: false, message: 'Resend API Key is required' };
        const from = config.email?.fromEmail || 'PhoneKoi Alerts <onboarding@resend.dev>';
        await this.sendResendEmail(apiKey, from, recipient, samplePayload);
        return { success: true, message: `Test alert email sent to ${recipient}` };
      }

      if (channel === 'WHATSAPP') {
        await this.sendWhatsAppAlert(config.whatsapp, recipient, samplePayload);
        return { success: true, message: `Test WhatsApp sent to ${recipient}` };
      }

      if (channel === 'SMS') {
        await this.sendSmsAlert(config.sms, recipient, samplePayload);
        return { success: true, message: `Test SMS sent to ${recipient}` };
      }

      return { success: false, message: 'Invalid test channel' };
    } catch (err: any) {
      this.logger.error(`Test ${channel} caught error: ${err?.message || err}`);
      return { success: false, message: err?.message || 'Operation failed' };
    }
  }
}
