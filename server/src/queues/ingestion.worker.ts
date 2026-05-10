import { Worker } from 'bullmq';
import { redis } from '../config/redis';
import { ingestDocument } from '../rag/ingestion';
import { db } from '../config/db';
import { documents } from '../db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '../utils/logger';
import type { IngestionJobData } from './ingestion.queue';

export const ingestionWorker = new Worker<IngestionJobData>(
  'pdf-ingestion',
  async (job) => {
    const { documentId, filePath, sessionId } = job.data;
    logger.info(`Processing document ${documentId}`);

    // Mark as processing
    await db.update(documents)
      .set({ status: 'processing' })
      .where(eq(documents.id, documentId));

    try {
      await ingestDocument(documentId, filePath, sessionId);

      // Mark as ready
      await db.update(documents)
        .set({ status: 'ready' })
        .where(eq(documents.id, documentId));

      logger.info(`Document ${documentId} ingestion complete`);
    } catch (err) {
      logger.error(`Document ${documentId} ingestion failed: ${err}`);

      await db.update(documents)
        .set({ status: 'failed', errorMsg: String(err) })
        .where(eq(documents.id, documentId));

      throw err; // rethrow so BullMQ retries per backoff config
    }
  },
  {
    connection: redis,
    concurrency: 3, // process up to 3 PDFs simultaneously
  }
);