import { sql } from 'drizzle-orm';
import { db } from '../config/db';
import { geminiEmbeddings } from './embeddings';

export interface RetrievedChunk {
  id: string;
  content: string;
  sourceFile: string;
  pageNumber: number | null;
  similarity: number;
}

export async function retrieveRelevantChunks(
  query: string,
  sessionId: string,
  topK = 5,
): Promise<RetrievedChunk[]> {
  const [queryEmbedding] = await geminiEmbeddings.embedDocuments([query]);
  const vectorLiteral = `[${queryEmbedding.join(',')}]`;

  const results = await db.execute(sql`
    SELECT
      dc.id,
      dc.content,
      dc.page_number,
      d.original_name AS source_file,
      1 - (dc.embedding <=> ${vectorLiteral}::vector) AS similarity
    FROM document_chunks dc
    JOIN documents d ON dc.document_id = d.id
    WHERE dc.session_id = ${sessionId}
    ORDER BY dc.embedding <=> ${vectorLiteral}::vector
    LIMIT ${topK}
  `);

  return results.rows.map((row: any) => ({
    id: row.id,
    content: row.content,
    sourceFile: row.source_file,
    pageNumber: row.page_number,
    similarity: parseFloat(row.similarity),
  }));
}

// export async function retrieveRelevantChunks(
//   query: string,
//   sessionId: string,
//   topK = 5,
//   threshold = 0.75
// ): Promise<RetrievedChunk[]> {
//   // ─── STEP 1: EMBED THE QUERY ─────────────────────────────────────────────
//   // We embed the user's question using the SAME model used during ingestion.
//   // This is critical — embeddings are only comparable if from the same model.
//   const [queryEmbedding] = await geminiEmbeddings.embedDocuments([query]);

//   // Convert number[] to pgvector literal string format
//   const vectorLiteral = `[${queryEmbedding.join(',')}]`;

//   // ─── STEP 2: COSINE SIMILARITY SEARCH ───────────────────────────────────
//   // <=> is pgvector's cosine DISTANCE operator (0 = identical, 2 = opposite)
//   // We convert to similarity with: 1 - distance (1 = identical, -1 = opposite)
//   //
//   // WHERE similarity > 0.75 filters out chunks that are not relevant enough.
//   // ORDER BY distance ASC = most similar first.
//   //
//   // session_id scoping is CRITICAL — without it, a user could get chunks
//   // from another user's documents.
//   const results = await db.execute(sql`
//     SELECT
//       dc.id,
//       dc.content,
//       dc.page_number,
//       d.original_name AS source_file,
//       1 - (dc.embedding <=> ${vectorLiteral}::vector) AS similarity
//     FROM document_chunks dc
//     JOIN documents d ON dc.document_id = d.id
//     WHERE dc.session_id = ${sessionId}
//       AND 1 - (dc.embedding <=> ${vectorLiteral}::vector) > ${threshold}
//     ORDER BY dc.embedding <=> ${vectorLiteral}::vector
//     LIMIT ${topK}
//   `);

//   return results.rows.map((row: any) => ({
//     id: row.id,
//     content: row.content,
//     sourceFile: row.source_file,
//     pageNumber: row.page_number,
//     similarity: parseFloat(row.similarity),
//   }));
// }