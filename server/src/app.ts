import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler';
import authRouter from './modules/auth/auth.router';
import sessionRouter from './modules/sessions/sessions.router'
import documentsRouter from './modules/documents/documents.router';


const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/sessions', sessionRouter)
app.use('/api/sessions/:sessionId/documents', documentsRouter);

app.get('/health', (_, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

export default app;