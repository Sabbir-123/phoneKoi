import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ImeiModule } from './imei/imei.module';
import { ReportsModule } from './reports/reports.module';
import { SearchLogsModule } from './search-logs/search-logs.module';
import { AuthModule } from './auth/auth.module';
import { SupabaseAuthGuard } from './auth/supabase-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { AdminModule } from './admin/admin.module';
import { AiModule } from './ai/ai.module';
import { UsersModule } from './users/users.module';
import { SearchEventsModule } from './search-events/search-events.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PoliceRecoveryModule } from './police-recovery/police-recovery.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 60,
      },
    ]),
    PrismaModule,
    ImeiModule,
    ReportsModule,
    SearchLogsModule,
    AuthModule,
    AdminModule,
    AiModule,
    UsersModule,
    SearchEventsModule,
    NotificationsModule,
    PoliceRecoveryModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: SupabaseAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
