import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler';
import authRouter from './modules/auth/auth.router';
import sessionRouter from './modules/sessions/sessions.router'
import documentsRouter from './modules/documents/documents.router';
import chatRouter from './modules/chat/chat.router';
import { env } from './config/env';


const app = express();

app.use(helmet());
app.use(cors({
    origin: env.CLIENT_URL,
    credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/sessions', sessionRouter)
app.use('/api/sessions/:sessionId/documents', documentsRouter);
app.use('/api/sessions/:sessionId/chat', chatRouter);

app.get('/health', (_, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

export default app;