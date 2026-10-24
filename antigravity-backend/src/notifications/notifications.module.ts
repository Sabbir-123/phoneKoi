import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AlertDispatcherService } from './alert-dispatcher.service';
import { TelegramBotService } from './telegram-bot.service';
import { NotificationsController } from './notifications.controller';

@Module({
  imports: [PrismaModule],
  controllers: [NotificationsController],
  providers: [AlertDispatcherService, TelegramBotService],
  exports: [AlertDispatcherService, TelegramBotService],
})
export class NotificationsModule {}
