import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PrismaService } from '../prisma/prisma.service';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private supabase: SupabaseClient | null = null;
  private adminEmail: string;

  constructor(private readonly prisma: PrismaService) {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    this.adminEmail = (process.env.ADMIN_EMAIL || 'ahmedsabbir2013@gmail.com').toLowerCase().trim();

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
      this.logger.log('Supabase client initialized for Auth verification');
    } else {
      this.logger.warn('Supabase URL or Key not set. Auth verification will fail.');
    }
  }

  async validateToken(token: string): Promise<AuthenticatedUser | null> {
    if (!this.supabase || !token) {
      return null;
    }

    try {
      const { data: { user }, error } = await this.supabase.auth.getUser(token);
      if (error || !user) {
        return null;
      }

      const email = (user.email || '').toLowerCase().trim();
      const isAdmin = email === this.adminEmail;

      // Check or sync with Prisma user
      let role: 'USER' | 'ADMIN' = isAdmin ? 'ADMIN' : 'USER';
      try {
        const dbUser = await this.prisma.user.findUnique({
          where: { email },
          select: { role: true }
        });
        if (dbUser?.role === 'ADMIN' || isAdmin) {
          role = 'ADMIN';
        }
      } catch (dbErr) {
        // Fallback to email matching if DB connection hiccups
        if (isAdmin) role = 'ADMIN';
      }

      return {
        id: user.id,
        email,
        role,
      };
    } catch (err: any) {
      this.logger.error(`Error validating Supabase token: ${err?.message || err}`);
      return null;
    }
  }
}
