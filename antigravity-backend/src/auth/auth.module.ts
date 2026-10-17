import { Module, Global } from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import { RolesGuard } from './roles.guard';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [SupabaseService, SupabaseAuthGuard, RolesGuard],
  exports: [SupabaseService, SupabaseAuthGuard, RolesGuard],
})
export class AuthModule {}
