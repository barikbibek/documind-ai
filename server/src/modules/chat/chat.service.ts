import { and, asc, desc, eq } from 'drizzle-orm';
import { db } from '../../config/db';
import { messages, chatSessions, documents } from '../../db/schema';

export async function hasReadyDocuments(sessionId: string) {
  const [document] = await db.select({ id: documents.id }).from(documents)
    .where(and(eq(documents.sessionId, sessionId), eq(documents.status, 'ready'))).limit(1);
  return Boolean(document);
}

export async function assertSessionOwnership(sessionId: string, userId: string) {
  const [session] = await db.select({ id: chatSessions.id }).from(chatSessions)
    .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId))).limit(1);
  if (!session) throw new Error('Session not found');
}

export async function getRecentChatHistory(sessionId: string) {
  const recent = await db.select({ role: messages.role, content: messages.content })
    .from(messages).where(eq(messages.sessionId, sessionId))
    .orderBy(desc(messages.createdAt)).limit(10);
  return recent.reverse();
}

export async function getChatHistory(sessionId: string | any, userId: string) {
  await assertSessionOwnership(sessionId, userId);

  return db
    .select()
    .from(messages)
    .where(eq(messages.sessionId, sessionId))
    .orderBy(asc(messages.createdAt));
}

export async function saveMessage(
  sessionId: string | any,
  role: 'user' | 'assistant',
  content: string,
  sources: unknown[] = []
) {
  const [message] = await db
    .insert(messages)
    .values({ sessionId, role, content, sources })
    .returning();

  if (role === 'user') {
    await db.update(chatSessions).set({ updatedAt: new Date() }).where(eq(chatSessions.id, sessionId));
  }

  return message;
}

export async function clearChatHistory(sessionId: string, userId: string) {
  // Verify session ownership
  await assertSessionOwnership(sessionId, userId);

  await db.delete(messages).where(eq(messages.sessionId, sessionId));
  return { message: 'Chat history cleared' };
}
