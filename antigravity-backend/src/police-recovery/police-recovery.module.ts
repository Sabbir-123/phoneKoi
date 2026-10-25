import { Module } from '@nestjs/common';
import { PoliceRecoveryService } from './police-recovery.service';
import { PoliceRecoveryController } from './police-recovery.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [PoliceRecoveryController],
  providers: [PoliceRecoveryService],
  exports: [PoliceRecoveryService],
})
export class PoliceRecoveryModule {}
