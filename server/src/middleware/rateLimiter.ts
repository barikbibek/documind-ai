import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import type { Request } from 'express';
import { env } from '../config/env';
import type { JwtPayload } from '../types';

function globalLimitKey(req: Request) {
  const token = req.headers.authorization?.match(/^Bearer (\S+)$/)?.[1];
  if (token) {
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
      if (typeof payload.userId === 'string') return `user:${payload.userId}`;
    } catch {
      // Unauthenticated requests fall back to the network address.
    }
  }
  return `ip:${ipKeyGenerator(req.ip ?? '')}`;
}

// Global rate limiter applied to all requests
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Allow normal document status polling; expensive actions have tighter limits below.
  keyGenerator: globalLimitKey,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false, message: 'Too many requests, please try again after 15 minutes',
  },
});

// Stricter rate limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit attempts for one email at one network address.
  keyGenerator: (req) => {
    const address = ipKeyGenerator(req.ip ?? '');
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    return email.length > 0 && email.length <= 254
      ? `${req.path}:${address}:${email}`
      : `${req.path}:${address}:invalid`;
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false, message: 'Too many login/register attempts, please try again after 15 minutes',
  },
});

// Rate limiter for expensive chat operations (LLM generation)
export const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Per authenticated user, in addition to the daily allowance.
  keyGenerator: (req) => req.user!.userId,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false, message: 'Too many messages sent, please wait a moment',
  },
});

// Rate limiter for document uploads (expensive processing)
export const documentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Per authenticated user, in addition to the daily PDF allowance.
  keyGenerator: (req) => req.user!.userId,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false, message: 'Upload limit reached, please try again in an hour',
  },
});
