import { Router } from 'express';
import mongoose from 'mongoose';
import { aiService } from '../services/ai.service.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { getProfile } from '../controllers/auth.controller.js';
import { handleChat } from '../controllers/tutor.controller.js';
import { handleEssayEvaluate } from '../controllers/essay.controller.js';
import { handleQuizGenerate } from '../controllers/quiz.controller.js';
import { handleTranslate } from '../controllers/translate.controller.js';
import { upload } from '../middleware/upload.middleware.js';

import authRoutes from './auth.routes.js';
import tutorRoutes from './tutor.routes.js';
import essayRoutes from './essay.routes.js';
import quizRoutes from './quiz.routes.js';
import translateRoutes from './translate.routes.js';
import flashcardRoutes from './flashcard.routes.js';
import dashboardRoutes from './dashboard.routes.js';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'StudyMate AI Node Server',
    ai_connected: aiService.isAvailable(),
    db_connected: mongoose.connection.readyState === 1
  });
});

// Domain routes
router.use('/auth', authRoutes);
router.use('/user/profile', authMiddleware, getProfile);
router.use('/tutor', tutorRoutes);
router.use('/essays', essayRoutes);
router.use('/quiz', quizRoutes);
router.use('/translate', translateRoutes);
router.use('/flashcards', flashcardRoutes);
router.use('/dashboard', dashboardRoutes);

// Backward-compatibility legacy route aliases
router.post('/api/chat', authMiddleware, handleChat);
router.post('/api/essay', authMiddleware, upload.single('file'), handleEssayEvaluate);
router.post('/api/quiz', authMiddleware, handleQuizGenerate);
router.post('/api/translate', authMiddleware, handleTranslate);

export default router;
