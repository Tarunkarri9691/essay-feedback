import { Router } from 'express';
import { handleTranslate } from '../controllers/translate.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.post('/text', handleTranslate);

export default router;
