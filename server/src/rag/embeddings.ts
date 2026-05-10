import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: env.GEMINI_EMBEDDING_MODEL });

// We replicate the same interface LangChain expects
// so ingestion.ts and retriever.ts don't need to change
export const geminiEmbeddings = {
  async embedDocuments(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];

    for (const text of texts) {
      const result = await embeddingModel.embedContent(text);
      embeddings.push(result.embedding.values);
    }

    return embeddings;
  },

  async embedQuery(text: string): Promise<number[]> {
    const result = await embeddingModel.embedContent(text);
    return result.embedding.values;
  },
};