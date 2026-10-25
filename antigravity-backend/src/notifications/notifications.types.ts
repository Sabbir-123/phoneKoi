export interface NotificationGatewaysConfig {
  telegram: {
    enabled: boolean;
    botToken: string;
    botUsername: string;
    adminChatId?: string;
  };
  email: {
    enabled: boolean;
    provider: 'RESEND' | 'EMAILJS' | 'SMTP';
    resendApiKey?: string;
    fromEmail?: string;
    emailjsServiceId?: string;
    emailjsTemplateId?: string;
    emailjsPublicKey?: string;
    emailjsPrivateKey?: string;
  };
  whatsapp: {
    enabled: boolean;
    provider: 'ULTRAMSG' | 'GREENAPI' | 'TWILIO' | 'META';
    instanceId?: string;
    token?: string;
    senderNumber?: string;
  };
  sms: {
    enabled: boolean;
    provider: 'GREENWEB' | 'SSL_WIRELESS' | 'BULKSMS_BD' | 'TWILIO';
    apiKey?: string;
    senderId?: string;
    clientSecret?: string;
  };
}

export interface SearchAlertPayload {
  imei: string;
  maskedImei: string;
  deviceName?: string;
  deviceBrand?: string;
  deviceModel?: string;
  searchResult: 'STOLEN' | 'LOST';
  timestamp: Date;
  ip?: string;
  latitude?: number | null;
  longitude?: number | null;
  accuracyRadius?: number | null;
  locationName?: string;
  policeGdNumber?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  ownerWhatsapp?: string;
  ownerTelegramChatId?: string;
  notificationPreferences?: string[];
  alertType?: 'INITIAL_SEARCH' | 'GPS_PINPOINT';
  isExactGps?: boolean;
}

export interface DeliveryChannelStatus {
  channel: 'IN_APP' | 'TELEGRAM' | 'EMAIL' | 'WHATSAPP' | 'SMS';
  status: 'DELIVERED' | 'FAILED' | 'SKIPPED';
  detail?: string;
  deliveredAt: string;
}
