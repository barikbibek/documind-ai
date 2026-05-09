import { Queue } from "bullmq"
import { redis } from "../config/redis"

export interface IngestionJobData {
    documentId: string;
    filePath: string;
    sessionId: string;
}

export const ingestionQueue = new Queue('pdf-ingestion', {
    connection: redis,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000,
        }
    }
})