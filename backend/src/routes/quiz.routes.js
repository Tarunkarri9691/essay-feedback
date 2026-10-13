import { Router } from 'express';
import { handleQuizGenerate, handleQuizSubmit } from '../controllers/quiz.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.post('/generate', handleQuizGenerate);
router.post('/submit', handleQuizSubmit);

export default router;
