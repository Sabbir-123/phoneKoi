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

  constructor(private readonly prisma: PrismaService) {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
      this.logger.log('Supabase client initialized for Auth and Storage verification');
    } else {
      this.logger.warn('Supabase URL or Key not set. Auth verification will fail.');
    }
  }

  async validateToken(token: string): Promise<AuthenticatedUser | null> {
    if (!this.supabase || !token) {
      return null;
    }

    try {
      const {
        data: { user },
        error,
      } = await this.supabase.auth.getUser(token);
      if (error || !user) {
        return null;
      }

      const email = (user.email || '').toLowerCase().trim();

      // Database-authoritative role check
      let role: 'USER' | 'ADMIN' = 'USER';
      try {
        const dbUser = await this.prisma.user.findUnique({
          where: { email },
          select: { role: true },
        });

        if (dbUser?.role === 'ADMIN') {
          role = 'ADMIN';
        } else if (user.app_metadata?.role === 'ADMIN') {
          role = 'ADMIN';
        }
      } catch (dbErr) {
        // Fallback to trusted app_metadata if direct DB check fails
        if (user.app_metadata?.role === 'ADMIN') {
          role = 'ADMIN';
        }
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

  /**
   * Uploads a file buffer to a Supabase Storage bucket.
   */
  async uploadFile(
    bucket: string,
    storagePath: string,
    fileBuffer: Buffer,
    contentType: string,
  ): Promise<string | null> {
    if (!this.supabase) return null;
    try {
      const { error } = await this.supabase.storage
        .from(bucket)
        .upload(storagePath, fileBuffer, {
          contentType,
          upsert: true,
        });

      if (error) {
        this.logger.error(`Error uploading to bucket ${bucket} at ${storagePath}: ${error.message}`);
        return null;
      }
      return storagePath;
    } catch (err: any) {
      this.logger.error(`Failed to upload file to ${bucket}: ${err?.message || err}`);
      return null;
    }
  }

  /**
   * Generates a short-lived signed URL for private bucket access.
   */
  async getSignedUrl(bucket: string, storagePath: string, expiresIn: number = 300): Promise<string | null> {
    if (!this.supabase || !storagePath) return null;
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .createSignedUrl(storagePath, expiresIn);

      if (error) {
        this.logger.error(`Error creating signed URL for ${storagePath}: ${error.message}`);
        return null;
      }
      return data?.signedUrl || null;
    } catch (err: any) {
      this.logger.error(`Failed creating signed URL: ${err?.message || err}`);
      return null;
    }
  }

  /**
   * Gets a public URL for an asset in a public bucket.
   */
  getPublicUrl(bucket: string, storagePath: string): string | null {
    if (!this.supabase || !storagePath) return null;
    try {
      const { data } = this.supabase.storage.from(bucket).getPublicUrl(storagePath);
      return data?.publicUrl || null;
    } catch {
      return null;
    }
  }
}
