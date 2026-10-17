import { createClient } from '@/utils/supabase/client';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Secure fetch wrapper that automatically attaches the active Supabase JWT Bearer token
 * to authenticate against the PhoneKoi NestJS backend.
 */
export async function authFetch(input: string | URL, init?: RequestInit): Promise<Response> {
  let token: string | undefined;
  try {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    token = session?.access_token;
  } catch (err) {
    console.warn('Could not retrieve Supabase session token:', err);
  }

  const headers = new Headers(init?.headers);
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(input, {
    ...init,
    headers,
  });
}
