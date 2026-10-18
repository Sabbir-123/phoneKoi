import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { sanitizeRedirectUrl } from '@/utils/security';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const rawNext = searchParams.get('next');
  const safeNext = sanitizeRedirectUrl(rawNext, '/dashboard');

  if (code) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Redirect to verified safe internal path after session exchange
  return NextResponse.redirect(new URL(safeNext, origin));
}
