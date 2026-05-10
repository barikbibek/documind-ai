import { eq } from 'drizzle-orm';
import { db } from '../../config/db';
import { messages, chatSessions } from '../../db/schema';

export async function getChatHistory(sessionId: string | any, userId: string) {
  // Verify session ownership
  const [session] = await db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.id, sessionId));

  if (!session || session.userId !== userId) {
    throw new Error('Session not found');
  }

  return db
    .select()
    .from(messages)
    .where(eq(messages.sessionId, sessionId));
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

  return message;
}

export async function clearChatHistory(sessionId: string, userId: string) {
  // Verify session ownership
  const [session] = await db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.id, sessionId));

  if (!session || session.userId !== userId) {
    throw new Error('Session not found');
  }

  await db.delete(messages).where(eq(messages.sessionId, sessionId));
  return { message: 'Chat history cleared' };
}