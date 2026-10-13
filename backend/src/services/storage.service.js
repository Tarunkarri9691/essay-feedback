import { loadJSONDatabase, saveJSONDatabase } from '../config/db.js';

class StorageService {
  constructor() {
    this.db = loadJSONDatabase();
  }

  save() {
    saveJSONDatabase(this.db);
  }

  // --- Users ---
  findUserByEmail(email) {
    if (!email) return null;
    return this.db.users.find(u => u.email?.toLowerCase() === email.toLowerCase()) || null;
  }

  findUserById(id) {
    if (!id) return null;
    return this.db.users.find(u => u.id === id) || null;
  }

  createUser(userData) {
    this.db.users.push(userData);
    this.save();
    return userData;
  }

  // --- Conversations ---
  getConversations(userId) {
    return (this.db.conversations || [])
      .filter(c => c.user_id === userId)
      .map(c => ({
        id: c.id,
        title: c.title,
        subject: c.subject,
        difficulty: c.difficulty,
        language: c.language,
        created_at: c.created_at,
        messageCount: c.messages?.length || 0
      }))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  getConversation(userId, conversationId) {
    return (this.db.conversations || []).find(
      c => c.id === conversationId && c.user_id === userId
    ) || null;
  }

  saveConversation(conversation) {
    const idx = (this.db.conversations || []).findIndex(c => c.id === conversation.id);
    if (idx >= 0) {
      this.db.conversations[idx] = conversation;
    } else {
      if (!this.db.conversations) this.db.conversations = [];
      this.db.conversations.push(conversation);
    }
    this.save();
    return conversation;
  }

  updateConversationTitle(userId, conversationId, title) {
    const conv = (this.db.conversations || []).find(
      c => c.id === conversationId && c.user_id === userId
    );
    if (conv) {
      conv.title = title;
      this.save();
      return conv;
    }
    return null;
  }

  deleteConversation(userId, conversationId) {
    if (!this.db.conversations) return false;
    const initialLen = this.db.conversations.length;
    this.db.conversations = this.db.conversations.filter(
      c => !(c.id === conversationId && c.user_id === userId)
    );
    this.save();
    return this.db.conversations.length < initialLen;
  }

  // --- Feedback ---
  addFeedback(feedback) {
    if (!this.db.feedback) this.db.feedback = [];
    this.db.feedback.push(feedback);
    this.save();
    return feedback;
  }

  // --- Essays ---
  getEssays(userId) {
    return (this.db.essays || [])
      .filter(e => e.user_id === userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  saveEssay(essay) {
    if (!this.db.essays) this.db.essays = [];
    this.db.essays.push(essay);
    this.save();
    return essay;
  }

  // --- Flashcards ---
  getFlashcards(userId) {
    return (this.db.flashcards || [])
      .filter(f => f.user_id === userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  createFlashcard(card) {
    if (!this.db.flashcards) this.db.flashcards = [];
    this.db.flashcards.push(card);
    this.save();
    return card;
  }

  deleteFlashcard(userId, cardId) {
    if (!this.db.flashcards) return false;
    const initialLen = this.db.flashcards.length;
    this.db.flashcards = this.db.flashcards.filter(
      f => !(f.id === cardId && f.user_id === userId)
    );
    this.save();
    return this.db.flashcards.length < initialLen;
  }

  // --- Progress ---
  getUserProgress(userId) {
    return (this.db.progress || [])
      .filter(p => p.user_id === userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  addProgress(progressItem) {
    if (!this.db.progress) this.db.progress = [];
    this.db.progress.push(progressItem);
    this.save();
    return progressItem;
  }
}

export const storageService = new StorageService();
