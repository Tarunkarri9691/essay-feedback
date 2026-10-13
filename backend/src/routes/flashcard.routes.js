import { Router } from 'express';
import { getFlashcards, createFlashcard, deleteFlashcard } from '../controllers/flashcard.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getFlashcards);
router.post('/', createFlashcard);
router.delete('/:id', deleteFlashcard);

export default router;
