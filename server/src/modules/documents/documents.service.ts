import { eq, and, desc } from 'drizzle-orm';
import { db } from '../../config/db';
import { documents, chatSessions } from '../../db/schema';
import { ingestionQueue } from '../../queues/ingestion.queue';
import type { Express } from 'express';
import { reserveUsage, releaseUsage } from '../usage/usage.service';
import { unlink } from 'node:fs/promises';
import path from 'node:path';
import { env } from '../../config/env';


export async function uploadDocuments(files: Express.Multer.File[], sessionId: string, userId: string){
    // verify session ownership first
    const [session] = await db.select().from(chatSessions).where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)))

    if(!session) throw new Error('Session not found')
    const reservations = await reserveUsage(userId, 'upload', files.length);
    let insertedDocs;
    try {
      insertedDocs = await db.insert(documents).values(files.map(file => ({
        sessionId, userId, filename: file.filename, originalName: file.originalname,
        fileSize: file.size, status: 'pending',
      }))).returning();
    } catch (err) {
      await Promise.allSettled(reservations.map(item => releaseUsage(userId, item.id)));
      await Promise.allSettled(files.map(file => unlink(file.path)));
      throw err;
    }

    for (const [index, doc] of insertedDocs.entries()) {
      try {
        await ingestionQueue.add('ingest-pdf', {
          documentId: doc.id, filePath: files[index].path, sessionId,
        });
      } catch {
        await Promise.allSettled([
          db.update(documents).set({ status: 'failed', errorMsg: 'Unable to queue PDF processing' }).where(eq(documents.id, doc.id)),
          releaseUsage(userId, reservations[index].id),
          unlink(files[index].path),
        ]);
        insertedDocs[index] = { ...doc, status: 'failed', errorMsg: 'Unable to queue PDF processing' };
      }
    }
    return insertedDocs;
}

export async function getSessionDocuments(sessionId: string, userId: string) {
  // Verify session ownership first
  const [session] = await db
    .select()
    .from(chatSessions)
    .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)));

  if (!session) throw new Error('Session not found');

  return db.select().from(documents).where(eq(documents.sessionId, sessionId)).orderBy(desc(documents.createdAt));
}

export async function getDocumentById(docId: string, userId: string) {
  const [doc] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, docId), eq(documents.userId, userId)));

  if (!doc) throw new Error('Document not found');
  return doc;
}

export async function deleteDocument(docId: string, userId: string) {
  const [deleted] = await db
    .delete(documents)
    .where(and(eq(documents.id, docId), eq(documents.userId, userId)))
    .returning();

  if (!deleted) throw new Error('Document not found');
  await unlink(path.join(env.UPLOAD_DIR, deleted.filename)).catch(() => {});
  return deleted;
  // Note: document_chunks are deleted automatically via ON DELETE CASCADE
}
