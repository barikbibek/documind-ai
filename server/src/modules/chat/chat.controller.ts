import type { Request, Response } from 'express';
import { runRAGChain, generateTitle } from '../../rag/chain';
import { getChatHistory, getRecentChatHistory, assertSessionOwnership, saveMessage, clearChatHistory, hasReadyDocuments } from './chat.service';
import { sendSuccess, sendError } from '../../utils/apiResponse';
import { logger } from '../../utils/logger';
import { updateSession } from '../sessions/sessions.service';
import { reserveUsage, UsageLimitError } from '../usage/usage.service';

export async function sendMessage(req: Request, res: Response) {
  const sessionId = req.params.sessionId as string;
  const { question } = req.body;
  const userId = req.user!.userId;

  // Check ownership and reserve the daily question before opening the stream.
  try {
    await assertSessionOwnership(sessionId, userId);
    if (!await hasReadyDocuments(sessionId)) {
      sendError(res, 'Upload a PDF and wait for it to finish processing before asking a question.', 409);
      return;
    }
    await reserveUsage(userId, 'question');
  } catch (err) {
    const status = err instanceof UsageLimitError ? 429 : (err as Error).message === 'Session not found' ? 404 : 500;
    if (status === 500) logger.error(err);
    sendError(res, status === 500 ? 'Could not start the response. Please try again.' : (err as Error).message, status);
    return;
  }

  // ─── SSE SETUP ────────────────────────────────────────────────────────────
  // SSE (Server-Sent Events) is a one-way channel: server → browser.
  // The browser opens one long HTTP connection and the server pushes
  // events down it whenever it wants. Perfect for streaming LLM tokens.
  //
  // Key headers:
  // - text/event-stream: tells browser this is SSE, not regular HTTP
  // - no-cache: prevents proxies from buffering our stream
  // - keep-alive: keeps the TCP connection open
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders(); // send headers immediately, don't wait for body

  // Helper to write an SSE event — format is strictly:
  // "data: <json>\n\n"  (double newline signals end of event)
  const send = (payload: object) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
    // Flush immediately so tokens stream through proxies in real-time
    if (typeof (res as any).flush === 'function') {
      (res as any).flush();
    }
  };

  try {
    // ─── FETCH CHAT HISTORY ─────────────────────────────────────────────────
    // We pass last 10 messages as context so Gemini can handle follow-ups.
    // "What did you mean by that?" only works if the LLM sees prior messages.
    const history = await getRecentChatHistory(sessionId as string);
    
    // If this is the first message, kick off title generation in parallel
    let titlePromise: Promise<void> | null = null;
    if (history.length === 0) {
      titlePromise = generateTitle(question).then(async (title) => {
        await updateSession(sessionId as string, userId, { title });
        send({ type: 'title_update', data: title });
      }).catch(err => {
        logger.error(`Error generating title: ${err}`);
      }) as Promise<void>;
    }

    const recentHistory = history.map(m => ({
      role: m.role,
      content: m.content as string,
    }));

    // ─── PERSIST USER MESSAGE ───────────────────────────────────────────────
    await saveMessage(sessionId, 'user', question);

    // ─── RUN RAG CHAIN ──────────────────────────────────────────────────────
    // runRAGChain is an async generator — it yields events one by one:
    // 1. { type: 'sources', data: [...chunks] }  ← sent before streaming starts
    // 2. { type: 'token', data: 'Hello' }         ← one per LLM token
    // 3. { type: 'token', data: ' world' }
    // 4. { type: 'done', data: {} }               ← signals completion
    let fullAnswer = '';
    let sources: unknown[] = [];

    for await (const event of runRAGChain(question, sessionId as any, recentHistory)) {
      if (event.type === 'sources') {
        sources = event.data as unknown[];
      }

      if (event.type === 'token') {
        fullAnswer += event.data as string;
      }

      // Forward every event to the browser as-is
      send(event);
    }

    // ─── PERSIST ASSISTANT MESSAGE ──────────────────────────────────────────
    // Save the complete answer only after streaming finishes.
    // We store sources too so they appear in chat history.
    await saveMessage(sessionId, 'assistant', fullAnswer, sources);

    // ─── WAIT FOR TITLE GENERATION ──────────────────────────────────────────
    // Ensure the title_update SSE event is sent before we close the connection
    if (titlePromise) {
      await titlePromise;
    }

  } catch (err) {
    logger.error(`Chat error: ${err}`);
    send({ type: 'error', data: { message: 'Something went wrong' } });
  } finally {
    // Always close the SSE connection when done
    res.end();
  }
}

export async function getMessages(req: Request, res: Response) {
  try {
    const history = await getChatHistory(req.params.sessionId, req.user!.userId);
    sendSuccess(res, history);
  } catch (err) {
    if ((err as Error).message === 'Session not found') return sendError(res, 'Session not found', 404);
    logger.error(err);
    sendError(res, 'Could not load chat history', 500);
  }
}

export async function clearMessages(req: Request, res: Response) {
  try {
    const result = await clearChatHistory((req.params.sessionId as any), req.user!.userId);
    sendSuccess(res, result);
  } catch (err) {
    if ((err as Error).message === 'Session not found') return sendError(res, 'Session not found', 404);
    logger.error(err);
    sendError(res, 'Could not clear chat history', 500);
  }
}
