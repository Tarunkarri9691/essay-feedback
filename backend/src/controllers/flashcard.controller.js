import { storageService } from '../services/storage.service.js';

export function getFlashcards(req, res) {
  const cards = storageService.getFlashcards(req.user.id);
  res.json(cards);
}

export function createFlashcard(req, res) {
  const { term, definition, subject = 'General', language = 'English' } = req.body;
  if (!term || !definition) {
    return res.status(400).json({ detail: 'Term and definition required' });
  }

  const card = {
    id: 'fc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    user_id: req.user.id,
    term,
    definition,
    subject,
    language,
    created_at: new Date().toISOString()
  };

  storageService.createFlashcard(card);
  res.json(card);
}

export function deleteFlashcard(req, res) {
  storageService.deleteFlashcard(req.user.id, req.params.id);
  res.json({ success: true });
}
