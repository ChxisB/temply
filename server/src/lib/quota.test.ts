import { beforeEach, describe, expect, it } from 'bun:test';
import { createTestDb, givePlan, type TestDb } from '../test/helpers';
import { checkEmailQuota, getEmailUsage, hoursUntilReset, recordEmailSend, ukDateString } from './quota';

let db: TestDb;
const USER = 'user_quota';
beforeEach(() => { db = createTestDb(); });

describe('ukDateString', () => {
  it('formats a UTC instant as the London calendar day', () => {
    // 2026-06-01 23:30 UTC is 2026-06-02 00:30 BST (London is UTC+1 in June).
    expect(ukDateString(new Date('2026-06-01T23:30:00Z'))).toBe('2026-06-02');
  });
});

describe('hoursUntilReset', () => {
  it('is ~24h just after London midnight and ~0h just before it', () => {
    // 2026-01-01 00:00 UTC == London midnight in winter (GMT).
    expect(hoursUntilReset(new Date('2026-01-01T00:00:00Z'))).toBeCloseTo(24, 0);
    expect(hoursUntilReset(new Date('2026-01-01T23:00:00Z'))).toBeCloseTo(1, 0);
  });
});

describe('email usage', () => {
  it('starts at zero and increments by recipient count', async () => {
    const now = new Date('2026-03-03T10:00:00Z');
    expect(await getEmailUsage(db, USER, now)).toBe(0);
    await recordEmailSend(db, USER, 3, now);
    await recordEmailSend(db, USER, 2, now);
    expect(await getEmailUsage(db, USER, now)).toBe(5);
  });

  it('counts each UK day separately', async () => {
    await recordEmailSend(db, USER, 4, new Date('2026-03-03T10:00:00Z'));
    await recordEmailSend(db, USER, 1, new Date('2026-03-04T10:00:00Z'));
    expect(await getEmailUsage(db, USER, new Date('2026-03-03T12:00:00Z'))).toBe(4);
    expect(await getEmailUsage(db, USER, new Date('2026-03-04T12:00:00Z'))).toBe(1);
  });
});

describe('checkEmailQuota', () => {
  it('allows a free user under 30 and blocks the send that would exceed it', async () => {
    const now = new Date('2026-03-03T10:00:00Z');
    await recordEmailSend(db, USER, 28, now);
    expect((await checkEmailQuota(db, USER, 2, now)).allowed).toBe(true);
    const blocked = await checkEmailQuota(db, USER, 3, now);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(2);
    expect(blocked.message).toContain('30');
  });

  it('uses the plan limit for a paid user', async () => {
    const now = new Date('2026-03-03T10:00:00Z');
    await givePlan(db, USER, 'pro');
    await recordEmailSend(db, USER, 400, now);
    expect((await checkEmailQuota(db, USER, 100, now)).allowed).toBe(true);
    expect((await checkEmailQuota(db, USER, 101, now)).allowed).toBe(false);
  });
});
