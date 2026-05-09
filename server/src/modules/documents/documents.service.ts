import { eq, and } from 'drizzle-orm';
import { db } from '../../config/db';
import { documents, chatSessions } from '../../db/schema';
import { ingestionQueue } from '../../queues/ingestion.queue';
import type { Express } from 'express';


export async function uploadDocuments(files: Express.Multer.File[], sessionId: string, userId: string){
    // verify session ownership first
    const [session] = await db.select().from(chatSessions).where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)))

    if(!session) throw new Error('Session not found')
    
    const insertedDocs = []

    for(let file of files){
        // insert docs record with status = pending
        const [doc] = await db.insert(documents).values({
            sessionId,
            userId,
            filename: file.filename,
            originalName: file.originalname,
            fileSize: file.size,
            status: 'pending',
        }).returning()

        await ingestionQueue.add('ingest-pdf', {
            documentId: doc.id,
            filePath: file.path,
            sessionId
        })

        insertedDocs.push(doc)
    }
    return insertedDocs
}

export async function getSessionDocuments(sessionId: string, userId: string) {
  // Verify session ownership first
  const [session] = await db
    .select()
    .from(chatSessions)
    .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)));

  if (!session) throw new Error('Session not found');

  return db.select().from(documents).where(eq(documents.sessionId, sessionId));
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
  return deleted;
  // Note: document_chunks are deleted automatically via ON DELETE CASCADE
}