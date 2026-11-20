import { createBrowserClient } from '@supabase/ssr';

export const SUPABASE_URL = 
  import.meta.env.VITE_SUPABASE_URL || 'https://auth.sunshade.icu';
export const SUPABASE_ANON_KEY = 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'anon-key-placeholder';

const isBrowser = typeof window !== 'undefined';
const isLocalhost = isBrowser && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const cookieOptions = {
  domain: isLocalhost ? undefined : '.sunshade.icu',
  path: '/',
  sameSite: 'lax' as const,
  secure: !isLocalhost,
};

// Target the 'learn' schema exclusively per SunShade Systems Database Laws
export const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  db: {
    schema: 'learn',
  },
  cookieOptions,
});

export function getHubLoginUrl(redirectTo?: string): string {
  const currentOrigin = isBrowser ? window.location.origin : 'https://learn.sunshade.icu';
  const target = redirectTo || currentOrigin;
  return `https://hub.sunshade.icu/login?redirectTo=${encodeURIComponent(target)}`;
}
