import { afterEach, describe, expect, it, vi } from 'vitest';
import { streamMessage } from './chat';
import { useAuthStore } from '../store/authStore';

afterEach(() => {
  vi.unstubAllGlobals();
  useAuthStore.setState({ token: null, user: null });
});

describe('streamMessage', () => {
  it('reassembles SSE events split across network chunks', async () => {
    useAuthStore.setState({ token: 'test-token' });
    const encoder = new TextEncoder();
    const chunks = ['data: {"type":"token","data":"Hel', 'lo"}\n\ndata: {"type":"done","data":{}}\n\n'];
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        chunks.forEach(chunk => controller.enqueue(encoder.encode(chunk)));
        controller.close();
      },
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(body, { status: 200 })));

    const events = [];
    for await (const event of streamMessage('session-id', 'question')) events.push(event);

    expect(events).toEqual([
      { type: 'token', data: 'Hello' },
      { type: 'done', data: {} },
    ]);
  });

  it('shows the server limit message before opening a stream', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ message: 'Daily question limit reached' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } },
    )));

    await expect(async () => {
      for await (const event of streamMessage('session-id', 'question')) { void event; }
    }).rejects.toThrow('Daily question limit reached');
  });
});
