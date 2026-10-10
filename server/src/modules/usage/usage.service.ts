import { and, count, eq, gte, lt } from 'drizzle-orm';
import { db } from '../../config/db';
import { usageEvents, users } from '../../db/schema';

export const USAGE_LIMITS = { questions: 50, uploads: 10 } as const;
type UsageKind = 'question' | 'upload';

export class UsageLimitError extends Error {
  constructor(message: string) { super(message); this.name = 'UsageLimitError'; }
}

function utcDay() {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

export async function getUsage(userId: string) {
  const { start, end } = utcDay();
  const [questionRows, uploadRows] = await Promise.all([
    db.select({ count: count() }).from(usageEvents).where(and(eq(usageEvents.userId, userId), eq(usageEvents.kind, 'question'), gte(usageEvents.createdAt, start), lt(usageEvents.createdAt, end))),
    db.select({ count: count() }).from(usageEvents).where(and(eq(usageEvents.userId, userId), eq(usageEvents.kind, 'upload'), gte(usageEvents.createdAt, start), lt(usageEvents.createdAt, end))),
  ]);
  return {
    questions: { used: questionRows[0].count, limit: USAGE_LIMITS.questions },
    uploads: { used: uploadRows[0].count, limit: USAGE_LIMITS.uploads },
    resetsAt: end.toISOString(),
  };
}

// Lock the account row so concurrent requests for one user cannot exceed the quota.
export async function reserveUsage(userId: string, kind: UsageKind, amount = 1) {
  return db.transaction(async (tx) => {
    const [user] = await tx.select({ id: users.id }).from(users).where(eq(users.id, userId)).for('update');
    if (!user) throw new Error('User not found');

    const { start, end } = utcDay();
    const [daily] = await tx.select({ count: count() }).from(usageEvents).where(and(
      eq(usageEvents.userId, userId), eq(usageEvents.kind, kind),
      gte(usageEvents.createdAt, start), lt(usageEvents.createdAt, end),
    ));
    const limit = kind === 'question' ? USAGE_LIMITS.questions : USAGE_LIMITS.uploads;
    if (daily.count + amount > limit) {
      throw new UsageLimitError(`Daily ${kind === 'question' ? 'question' : 'PDF upload'} limit reached. Resets at 00:00 UTC.`);
    }
    const createdAt = new Date();
    return tx.insert(usageEvents).values(Array.from({ length: amount }, () => ({ userId, kind, createdAt }))).returning({ id: usageEvents.id });
  });
}

export async function releaseUsage(userId: string, eventId: string) {
  await db.delete(usageEvents).where(and(eq(usageEvents.id, eventId), eq(usageEvents.userId, userId)));
}
