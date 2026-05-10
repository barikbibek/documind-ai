import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { retrieveRelevantChunks, type RetrievedChunk } from './retriever';
import { SYSTEM_PROMPT } from './prompts';
import { env } from '../config/env';

const llm = new ChatGoogleGenerativeAI({
  apiKey: env.GEMINI_API_KEY,
  model: env.GEMINI_CHAT_MODEL, // gemini-1.5-flash
  temperature: 0.2,
  streaming: true,
});

export async function* runRAGChain(
  question: string,
  sessionId: string,
  chatHistory: { role: string; content: string }[]
): AsyncGenerator<{ type: 'sources' | 'token' | 'done' | 'error'; data: unknown }> {
  // ─── STEP 1: RETRIEVE RELEVANT CHUNKS ───────────────────────────────────
  const chunks: RetrievedChunk[] = await retrieveRelevantChunks(question, sessionId);

  if (chunks.length === 0) {
    // No relevant chunks found — still respond gracefully
    yield { type: 'sources', data: [] };
    yield { type: 'token', data: 'I could not find relevant information in your documents for this question.' };
    yield { type: 'done', data: {} };
    return;
  }

  // ─── STEP 2: SEND SOURCES TO CLIENT IMMEDIATELY ─────────────────────────
  // We yield sources BEFORE streaming the answer so the frontend
  // can show "Sources: report.pdf p.4" while the answer is still streaming.
  yield { type: 'sources', data: chunks };

  // ─── STEP 3: BUILD CONTEXT STRING ───────────────────────────────────────
  // Format each chunk with its source info so the LLM knows where it came from
  const context = chunks
    .map(c => `[Source: ${c.sourceFile}, Page ${c.pageNumber}]\n${c.content}`)
    .join('\n\n---\n\n');

  // ─── STEP 4: BUILD PROMPT ────────────────────────────────────────────────
  // We inject chat history so the LLM can handle follow-up questions.
  // "What did you mean by that?" only makes sense with history.
  const prompt = ChatPromptTemplate.fromMessages([
    ['system', SYSTEM_PROMPT],
    ...chatHistory.map(m => [
      m.role === 'user' ? 'human' : 'assistant',
      m.content
    ] as ['human' | 'assistant', string]),
    ['human', '{question}'],
  ]);

  // ─── STEP 5: STREAM TOKENS ───────────────────────────────────────────────
  // pipe() chains: prompt → LLM → output parser
  // StringOutputParser extracts just the text from LLM response objects
  const chain = prompt.pipe(llm).pipe(new StringOutputParser());
  const stream = await chain.stream({ context, question });

  let fullResponse = '';
  for await (const token of stream) {
    fullResponse += token;
    yield { type: 'token', data: token };
  }

  yield { type: 'done', data: { fullResponse } };
}