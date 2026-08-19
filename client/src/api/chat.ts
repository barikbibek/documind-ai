import { useAuthStore } from '../store/authStore';
import { apiClient } from './client';
import type { SSEEvent, Message } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export async function* streamMessage(
  sessionId: string,
  question: string
): AsyncGenerator<SSEEvent> {
  const token = useAuthStore.getState().token;

  const response = await fetch(`${BASE_URL}/sessions/${sessionId}/chat/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ question }),
  });

  if (!response.ok) {
    throw new Error(`Chat request failed: ${response.status}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // SSE events are separated by double newlines (\n\n)
    // Split on \n\n to get complete events
    const parts = buffer.split('\n\n');
    // The last part might be incomplete, keep it in the buffer
    buffer = parts.pop() ?? '';

    for (const part of parts) {
      // Each part may contain multiple lines (e.g., "event: ...\ndata: ...")
      // We only care about lines starting with "data: "
      const lines = part.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        try {
          const event = JSON.parse(trimmed.slice(6)) as SSEEvent;
          yield event;
        } catch {
          // malformed JSON, skip
        }
      }
    }
  }

  // Process any remaining data in the buffer
  if (buffer.trim()) {
    const lines = buffer.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data: ')) continue;
      try {
        const event = JSON.parse(trimmed.slice(6)) as SSEEvent;
        yield event;
      } catch {
        // malformed JSON, skip
      }
    }
  }
}

export const chatApi = {
  getMessages: () =>
    apiClient<{ data: Message[] }>('/sessions'),

  getSessionMessages: (sessionId: string) =>
    apiClient<{ data: Message[] }>(`/sessions/${sessionId}/chat/messages`),

  clearMessages: (sessionId: string) =>
    apiClient<{ data: unknown }>(`/sessions/${sessionId}/chat/messages`, {
      method: 'DELETE',
    }),
};