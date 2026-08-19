import request from 'supertest';
import { describe, it, expect } from 'vitest';
import app from './app';

describe('App', () => {
  it('should return 200 OK for the health check', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('should enforce global rate limits', async () => {
    // We send 101 requests. The global limiter is set to 100 per 15 minutes.
    // The 101st request should return a 429 status code.
    for (let i = 0; i < 100; i++) {
      await request(app).get('/health');
    }
    const res = await request(app).get('/health');
    expect(res.status).toBe(429);
  });
});
