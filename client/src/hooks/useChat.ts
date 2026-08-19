import { useState, useCallback, useEffect } from 'react';
import { streamMessage, chatApi } from '../api/chat';
import { useSessionStore } from '../store/sessionStore';
import type { Message, Source } from '../types';

export function useChat(sessionId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setStreaming] = useState(false);

  useEffect(() => {
    chatApi.getSessionMessages(sessionId)
      .then((res) => setMessages(res.data || []));
  }, [sessionId]);

  const sendMessage = useCallback(async (question: string) => {
    if (isStreaming) return;
    setStreaming(true);

    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setMessages((prev) => [...prev, { role: 'assistant', content: '', sources: [] }]);

    try {
      for await (const event of streamMessage(sessionId, question)) {
        //console.log('[DocuMind] SSE event:', event.type, event);
        if (event.type === 'token') {
          setMessages((prev) => {
            const msgs = [...prev];
            msgs[msgs.length - 1] = {
              ...msgs[msgs.length - 1],
              content: msgs[msgs.length - 1].content + event.data,
            };
            return msgs;
          });
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
          //console.log('[DocuMind] title_update received:', event.data);
          useSessionStore.getState().updateSessionTitle(sessionId, event.data as string);
        }

        if (event.type === 'error') {
          setMessages((prev) => {
            const msgs = [...prev];
            msgs[msgs.length - 1] = {
              ...msgs[msgs.length - 1],
              content: 'Something went wrong. Please try again.',
            };
            return msgs;
          });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setStreaming(false);
    }
  }, [sessionId, isStreaming]);

  const clearMessages = useCallback(async () => {
    await chatApi.clearMessages(sessionId);
    setMessages([]);
  }, [sessionId]);

  return { messages, isStreaming, sendMessage, clearMessages };
}