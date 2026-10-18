/**
 * Security utilities for Phone Koi frontend.
 */

/**
 * Sanitizes and validates internal redirect paths to prevent Open Redirects
 * and DOM-based Cross-Site Scripting (XSS) via `javascript:`, `data:`, or external URLs.
 *
 * @param url The raw redirect candidate string from query parameters or user input
 * @param fallback Safe default destination (defaults to '/dashboard')
 * @returns A strictly validated, internal pathname string
 */
export function sanitizeRedirectUrl(url: string | null | undefined, fallback: string = '/dashboard'): string {
  if (!url || typeof url !== 'string') {
    return fallback;
  }

  const trimmed = url.trim();

  // Reject empty string or protocol-based / external attempts
  if (
    !trimmed ||
    trimmed.startsWith('//') ||
    trimmed.startsWith('/\\') ||
    trimmed.startsWith('\\\\') ||
    /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed) // Rejects http:, https:, javascript:, data:, etc.
  ) {
    return fallback;
  }

  // Ensure path starts with a single leading slash
  if (!trimmed.startsWith('/')) {
    return fallback;
  }

  try {
    // Validate by resolving against a dummy local base
    const parsed = new URL(trimmed, 'https://phonekoi.local');

    // Hostname must strictly remain internal
    if (parsed.hostname !== 'phonekoi.local') {
      return fallback;
    }

    // Return the safe pathname + search + hash
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
