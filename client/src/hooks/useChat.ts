import { useState, useCallback, useEffect, useRef } from 'react';
import { streamMessage, chatApi } from '../api/chat';
import { useSessionStore } from '../store/sessionStore';
import type { Message, Source } from '../types';

export function useChat(sessionId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setStreaming] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState('');
  const streamingRef = useRef(false);
  const pendingTokens = useRef('');
  const frameRef = useRef<number | null>(null);

  const flushTokens = useCallback(() => {
    frameRef.current = null;
    const tokens = pendingTokens.current;
    pendingTokens.current = '';
    if (!tokens) return;
    setMessages((prev) => {
      const msgs = [...prev];
      const last = msgs.length - 1;
      if (last >= 0 && msgs[last].role === 'assistant') {
        msgs[last] = { ...msgs[last], content: msgs[last].content + tokens };
      }
      return msgs;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    chatApi.getSessionMessages(sessionId)
      .then((res) => {
        if (!cancelled) setMessages(res.data || []);
      })
      .catch(() => { if (!cancelled) setError('Could not load this chat. Try reopening it.'); })
      .finally(() => { if (!cancelled) setLoadingHistory(false); });
    return () => {
      cancelled = true;
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [sessionId]);

  const sendMessage = useCallback(async (question: string): Promise<boolean> => {
    if (streamingRef.current || loadingHistory) return false;
    streamingRef.current = true;
    setError('');
    setStreaming(true);

    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setMessages((prev) => [...prev, { role: 'assistant', content: '', sources: [] }]);

    let accepted = false;
    try {
      let failed = false;
      let completed = false;
      for await (const event of streamMessage(sessionId, question)) {
        accepted = true;
        if (event.type === 'done') completed = true;
        if (event.type === 'token') {
          pendingTokens.current += event.data;
          if (frameRef.current === null) frameRef.current = requestAnimationFrame(flushTokens);
        }

        if (event.type === 'sources') {
          setMessages((prev) => {
            const msgs = [...prev];
            msgs[msgs.length - 1] = {
              ...msgs[msgs.length - 1],
              sources: event.data as Source[],
            };
            return msgs;
          });
        }

        if (event.type === 'title_update') {
          useSessionStore.getState().updateSessionTitle(sessionId, event.data as string);
        }

        if (event.type === 'error') {
          failed = true;
          if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
          flushTokens();
          setMessages((prev) => {
            const msgs = [...prev];
            msgs[msgs.length - 1] = {
              ...msgs[msgs.length - 1],
              content: event.data.message || 'Something went wrong. Please try again.',
            };
            return msgs;
          });
        }
      }
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      flushTokens();
      if (failed || !completed) setError('The response was interrupted. You can try again.');
      return true;
    } catch (err) {
      if (!accepted) {
        setMessages((prev) => prev.slice(0, -2));
        setError((err as Error).message);
        return false;
      }
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      flushTokens();
      setError('The response was interrupted. You can try again.');
      return true;
    } finally {
      if (accepted) window.dispatchEvent(new Event('usage-updated'));
      streamingRef.current = false;
      setStreaming(false);
    }
  }, [sessionId, flushTokens, loadingHistory]);

  const clearMessages = useCallback(async () => {
    if (streamingRef.current) return;
    try {
      await chatApi.clearMessages(sessionId);
      setMessages([]);
      setError('');
    } catch (err) {
      setError((err as Error).message);
    }
  }, [sessionId]);

  return { messages, isStreaming, loadingHistory, error, sendMessage, clearMessages };
}
