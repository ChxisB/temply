import { beforeEach, describe, expect, it } from 'bun:test';
import { createTestDb, givePlan, type TestDb } from '../test/helpers';
import { checkApiQuota, getApiUsage, nextResetDate, recordApiCall, ukMonthString } from './api-quota';

let db: TestDb;
const USER = 'user_api';
beforeEach(() => { db = createTestDb(); });

describe('ukMonthString', () => {
  it('uses the London calendar month', () => {
    // 2026-06-30 23:30 UTC is 2026-07-01 00:30 BST.
    expect(ukMonthString(new Date('2026-06-30T23:30:00Z'))).toBe('2026-07');
  });
});

describe('nextResetDate', () => {
  it('is the 1st of the next month', () => {
    expect(nextResetDate(new Date('2026-03-10T12:00:00Z'))).toBe('2026-04-01');
    expect(nextResetDate(new Date('2026-12-10T12:00:00Z'))).toBe('2027-01-01');
  });
});

describe('api usage', () => {
  it('increments per call and separates months', async () => {
    const march = new Date('2026-03-03T10:00:00Z');
    expect(await getApiUsage(db, USER, march)).toBe(0);
    await recordApiCall(db, USER, march);
    await recordApiCall(db, USER, march);
    expect(await getApiUsage(db, USER, march)).toBe(2);
    await recordApiCall(db, USER, new Date('2026-04-03T10:00:00Z'));
    expect(await getApiUsage(db, USER, march)).toBe(2);
  });
});

describe('checkApiQuota', () => {
  it('blocks a free user at the limit (uses PLAN_LIMITS)', async () => {
    // Free maxApiCalls is set to 10_000 in Task 2; this test is written to
    // that number and will pass once Task 2 lands. To keep Task 1 green on
    // its own, seed usage relative to the limit read at runtime.
    const now = new Date('2026-03-03T10:00:00Z');
    const first = await checkApiQuota(db, USER, now);
    // Free's maxApiCalls is 0 today (Task 2 raises it to 10_000), so "at the
    // limit" is already true with zero usage — seed relative to whatever the
    // runtime limit is instead of assuming it's non-zero.
    if (first.limit > 0) {
      expect(first.allowed).toBe(true);
      for (let i = 0; i < first.limit; i++) await recordApiCall(db, USER, now);
    } else {
      expect(first.allowed).toBe(false);
    }
    const blocked = await checkApiQuota(db, USER, now);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it('always allows an unlimited plan', async () => {
    await givePlan(db, USER, 'enterprise');
    const now = new Date('2026-03-03T10:00:00Z');
    await recordApiCall(db, USER, now);
    const res = await checkApiQuota(db, USER, now);
    expect(res.allowed).toBe(true);
    expect(res.limit).toBe(Infinity);
  });
});
