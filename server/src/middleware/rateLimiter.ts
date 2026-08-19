import rateLimit from 'express-rate-limit';

// Global rate limiter applied to all requests
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    error: 'Too many requests from this IP, please try again after 15 minutes',
  },
});

// Stricter rate limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per `window`
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many login/register attempts from this IP, please try again after 15 minutes',
  },
});

// Rate limiter for expensive chat operations (LLM generation)
export const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 messages per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many messages sent, please wait a moment',
  },
});

// Rate limiter for document uploads (expensive processing)
export const documentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 uploads per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Upload limit reached, please try again in an hour',
  },
});
