import { Router } from 'express';
import { sendMessage, getMessages, clearMessages } from './chat.controller';
import { authMiddleware } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { sendMessageSchema } from './chat.schema';

const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.get('/messages', getMessages);
router.post('/message', validate(sendMessageSchema), sendMessage);
router.delete('/messages', clearMessages);

export default router;