import { Router } from 'express';
import { handleOCR, handleEssayEvaluate, getEssays } from '../controllers/essay.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = Router();

router.use(authMiddleware);

router.post('/ocr', upload.single('image'), handleOCR);
router.post('/evaluate', upload.single('file'), handleEssayEvaluate);
router.get('/', getEssays);

export default router;
