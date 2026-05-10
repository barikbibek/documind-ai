import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { geminiEmbeddings  } from './embeddings';
import { db } from '../config/db';
import { documentChunks } from '../db/schema';
import { logger } from '../utils/logger';


export async function ingestDocument(documentId: string, filePath: string, sessionId: string){
    // ─── STEP 1: LOAD PDF ───────────────────────────────────────────────────
    // PDFLoader reads the file and returns LangChain Document objects.
    // splitPages: true means each page becomes its own Document.
    // This preserves page number metadata which we store and show as citations.
    const loader = new PDFLoader(filePath, { splitPages: true });
    const rawDocs = await loader.load();
    logger.info(`Loaded ${rawDocs.length} pages from PDF`);

    // ─── STEP 2: CHUNK THE TEXT ─────────────────────────────────────────────
    // Why chunk? You can't embed an entire PDF as one vector — you'd lose
    // granularity. If someone asks about one paragraph, you don't want to
    // retrieve all 200 pages.
    //
    // RecursiveCharacterTextSplitter tries to split on paragraph breaks first
    // (\n\n), then line breaks (\n), then sentences, then words.
    // This keeps semantically related text together.
    //
    // chunkSize: 1000 chars ≈ ~250 tokens — fits well in LLM context
    // chunkOverlap: 200 chars — repeated at boundaries so no sentence is lost
    const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
    separators: ['\n\n', '\n', '. ', ' ', ''],
    });

    const chunks = await splitter.splitDocuments(rawDocs);
    logger.info(`Split into ${chunks.length} chunks`);

    // ─── STEP 3: EMBED + STORE IN BATCHES ───────────────────────────────────
    // We batch because OpenAI has rate limits.
    // Each batch: extract text → get embeddings → insert into pgvector.
    //
    // We do this in one loop so we never hold all embeddings in memory at once.
    // For a 200-page PDF this could be 400+ chunks × 1536 floats = ~2.4MB
    const BATCH_SIZE = 100;

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        const batch = chunks.slice(i, i + BATCH_SIZE);
        const texts = batch.map((c: any) => c.pageContent);

        // embedDocuments returns number[][] — one number[768] per text
        const embeddings = await geminiEmbeddings.embedDocuments(texts);
        await db.insert(documentChunks).values(
        batch.map((chunk: any, idx: any) => ({
            documentId,
            sessionId,
            content: chunk.pageContent,
            embedding: embeddings[idx], // number[] → stored as vector(1536)
            chunkIndex: i + idx,
            // PDFLoader stores page number in metadata.loc.pageNumber (0-indexed)
            pageNumber: Number(chunk.metadata?.loc?.pageNumber ?? 0) + 1,
            metadata: chunk.metadata,
        }))
        );

        logger.info(`Embedded and stored batch ${i / BATCH_SIZE + 1}`);
    }

    logger.info(`Ingestion complete for document ${documentId}`);
}
