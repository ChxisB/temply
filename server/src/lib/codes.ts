import { createHash } from 'crypto';

const BASE62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

function randomBase62(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let result = '';
  for (let i = 0; i < length; i++) result += BASE62[bytes[i] % 62];
  return result;
}

export function generateShortCode(): string {
  return `tpl_${randomBase62(8)}`;
}

export function generateApiKey(): { fullKey: string; prefix: string; hash: string } {
  const secret = randomBase62(32);
  const fullKey = `tply_live_${secret}`;
  const prefix = fullKey.slice(0, 14);
  const hash = createHash('sha256').update(fullKey).digest('hex');
  return { fullKey, prefix, hash };
}

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}
