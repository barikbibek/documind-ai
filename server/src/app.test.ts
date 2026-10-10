import request from 'supertest';
import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import app from './app';
import { env } from './config/env';

describe('App', () => {
  it('should return 200 OK for the health check', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('uses separate global limits for signed-in accounts behind the proxy', async () => {
    const tokenFor = (userId: string) => jwt.sign({ userId }, env.JWT_SECRET);
    const first = await request(app).get('/health').set('Authorization', `Bearer ${tokenFor('audit-user-1')}`);
    const second = await request(app).get('/health').set('Authorization', `Bearer ${tokenFor('audit-user-1')}`);
    const other = await request(app).get('/health').set('Authorization', `Bearer ${tokenFor('audit-user-2')}`);
    const remaining = (response: typeof first) => Number(response.headers['ratelimit-remaining']);

    expect(remaining(second)).toBe(remaining(first) - 1);
    expect(remaining(other)).toBe(remaining(first));
  });

  it('should enforce global rate limits', async () => {
    // The global limiter allows 300 requests per 15 minutes.
    for (let i = 0; i < 300; i++) {
      await request(app).get('/health');
    }
    const res = await request(app).get('/health');
    expect(res.status).toBe(429);
  });
});
