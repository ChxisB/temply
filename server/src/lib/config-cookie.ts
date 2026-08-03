/**
 * The sending config (Resend key + setup progress) all lives in one browser
 * cookie. Three routes touch it — config, emails, sending — so the read/write
 * lives here once instead of being re-parsed inline in each.
 *
 * `setup` holds only the facts Temply cannot otherwise verify: the two
 * self-confirmed external steps, whether the domain step was skipped, and when
 * a test was last sent. The key's presence and the real domain status are
 * ground truth read live, never mirrored here.
 */

export type SendingSetup = {
  accountConfirmed: boolean;
  keyConfirmed: boolean;
  testSentAt: string | null;
  domainSkipped: boolean;
};

export type ConfigCookie = {
  provider?: string;
  apiKey?: string;
  setup?: Partial<SendingSetup>;
};

export const DEFAULT_SETUP: SendingSetup = {
  accountConfirmed: false,
  keyConfirmed: false,
  testSentAt: null,
  domainSkipped: false,
};

const COOKIE_NAME = '__temply_config__';

export function readConfigCookie(request: Request): ConfigCookie {
  const cookieHeader = request.headers.get('cookie') || '';
  const raw = cookieHeader
    .split(';')
    .find((c) => c.trim().startsWith(`${COOKIE_NAME}=`))
    ?.split('=')[1];
  if (!raw) return {};
  try {
    return JSON.parse(decodeURIComponent(raw));
  } catch {
    // A corrupt cookie should not take a route down with it.
    return {};
  }
}

/** Matches the flags config.ts already writes, so every route updates the one
 *  same cookie rather than forking it. */
export function buildConfigCookieHeader(cookie: ConfigCookie): string {
  const isDev = process.env.NODE_ENV !== 'production';
  const value = encodeURIComponent(JSON.stringify(cookie));
  return `${COOKIE_NAME}=${value}; Max-Age=${60 * 60 * 24 * 30}; Path=/; HttpOnly=${!isDev}; Secure=${!isDev}; SameSite=Lax`;
}

export function readSetup(cookie: ConfigCookie): SendingSetup {
  return { ...DEFAULT_SETUP, ...(cookie.setup || {}) };
}
