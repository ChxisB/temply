/**
 * The single source of truth for plan limits.
 *
 * Previously these lived in server/src/lib/billing.ts, so the client had no way
 * to know a limit without hardcoding it. Both sides import from here now.
 */

export type Plan = 'free' | 'pro' | 'scale';

export interface PlanLimits {
  maxTemplates: number;
  maxApiKeys: number;
  maxVersions: number;
  maxApiCalls: number;
}

/** `Infinity` means unlimited. It does not survive JSON, so anything sending
 *  limits over the wire must map it — see `serialiseLimits`. */
export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: { maxTemplates: 3, maxApiKeys: 0, maxVersions: 0, maxApiCalls: 0 },
  pro: { maxTemplates: Infinity, maxApiKeys: 5, maxVersions: 10, maxApiCalls: 10_000 },
  scale: { maxTemplates: Infinity, maxApiKeys: Infinity, maxVersions: 25, maxApiCalls: 100_000 },
};

/** JSON turns Infinity into null, so send null over the wire and read it back
 *  as "no limit" on the client. */
export type WireLimits = {
  maxTemplates: number | null;
  maxApiKeys: number | null;
  maxVersions: number | null;
  maxApiCalls: number | null;
};

export function serialiseLimits(limits: PlanLimits): WireLimits {
  const wire = (n: number) => (Number.isFinite(n) ? n : null);
  return {
    maxTemplates: wire(limits.maxTemplates),
    maxApiKeys: wire(limits.maxApiKeys),
    maxVersions: wire(limits.maxVersions),
    maxApiCalls: wire(limits.maxApiCalls),
  };
}

/** null (or a non-finite) limit means unlimited, so nothing is ever "reached". */
export function isLimitReached(used: number, limit: number | null): boolean {
  if (limit === null || !Number.isFinite(limit)) return false;
  return used >= limit;
}
