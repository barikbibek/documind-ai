import { Router } from 'express';
import { upload, list, getOne, remove } from './documents.controller';
import { authMiddleware } from '../../middleware/auth';
import { uploadMiddleware } from '../../middleware/upload';

// mergeParams: true lets us access :sessionId from the parent router
const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.post('/upload', uploadMiddleware.array('files', 10), upload);
router.get('/', list);
router.get('/:docId', getOne);
router.delete('/:docId', remove);

export default router;