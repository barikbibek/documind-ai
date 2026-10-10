import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler';
import { globalLimiter } from './middleware/rateLimiter';
import authRouter from './modules/auth/auth.router';
import sessionRouter from './modules/sessions/sessions.router'
import documentsRouter from './modules/documents/documents.router';
import chatRouter from './modules/chat/chat.router';
import { env } from './config/env';
import { db } from './config/db';
import { redis } from './config/redis';
import { sql } from 'drizzle-orm';


const app = express();
// Nginx is the only service that can reach the private backend port.
app.set('trust proxy', 1);

app.use(helmet());
app.use(globalLimiter);
const allowedOrigins = env.CLIENT_URL.split(',').map(o => o.trim());

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/sessions', sessionRouter)
app.use('/api/sessions/:sessionId/documents', documentsRouter);
app.use('/api/sessions/:sessionId/chat', chatRouter);

app.get('/health', (_, res) => res.json({ status: 'ok' }));
app.get('/health/ready', async (_, res) => {
    if (redis.status !== 'ready') return res.status(503).json({ status: 'unavailable' });
    try {
        await db.execute(sql`select 1`);
        res.json({ status: 'ok' });
    } catch {
        res.status(503).json({ status: 'unavailable' });
    }
});

app.use(errorHandler);

export default app;
