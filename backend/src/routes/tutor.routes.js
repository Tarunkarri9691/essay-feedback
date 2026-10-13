import { Router } from 'express';
import {
  handleChat,
  getConversations,
  getConversationById,
  updateConversationTitle,
  deleteConversation,
  logFeedback
} from '../controllers/tutor.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.post('/chat', handleChat);
router.get('/conversations', getConversations);
router.get('/conversations/:cid', getConversationById);
router.put('/conversations/:cid', updateConversationTitle);
router.delete('/conversations/:cid', deleteConversation);
router.post('/feedback', logFeedback);

export default router;
