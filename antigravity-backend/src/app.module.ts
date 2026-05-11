import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ImeiModule } from './imei/imei.module';
import { ReportsModule } from './reports/reports.module';
import { SearchLogsModule } from './search-logs/search-logs.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { AiModule } from './ai/ai.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [PrismaModule, ImeiModule, ReportsModule, SearchLogsModule, AuthModule, AdminModule, AiModule, UsersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
