import { queryOptions } from '@tanstack/react-query';
import { httpGet } from '~/lib/http';

export type SendingStatus = {
  keyPresent: boolean;
  testSentAt: string | null;
  manual: { account: boolean; key: boolean };
  domainSkipped: boolean;
  dismissed: boolean;
  domain: { name: string; status: string; verified: boolean } | null;
  domainError: string | null;
};

export function sendingStatusQueryOptions() {
  return queryOptions({
    queryKey: ['sending-status'],
    queryFn: () => httpGet<SendingStatus>('/api/v1/sending/status', {}),
    // The nav pill reads this on every dashboard page. Cache it so we do not
    // hit the sending service's domain API on every navigation.
    staleTime: 30_000,
  });
}

/**
 * The four Stage 1 steps, in order. A step is done either because Temply can
 * see it (the key is present, a test was sent) or because the user self-
 * confirmed an external action Temply cannot observe. Having a key at all
 * proves the account and key steps, so those tick themselves once connected.
 */
export function stageOne(status: SendingStatus | undefined) {
  const s = status;
  const account = Boolean(s?.manual.account || s?.keyPresent);
  const key = Boolean(s?.manual.key || s?.keyPresent);
  const pasted = Boolean(s?.keyPresent);
  const tested = Boolean(s?.testSentAt);
  const steps = [account, key, pasted, tested];
  const done = steps.filter(Boolean).length;
  return { account, key, pasted, tested, done, total: steps.length, ready: done === steps.length };
}

export function domainDone(status: SendingStatus | undefined) {
  return Boolean(status?.domain?.verified || status?.domainSkipped);
}

/** Everything, including the optional customer-ready domain step. */
export function allDone(status: SendingStatus | undefined) {
  return stageOne(status).ready && domainDone(status);
}
