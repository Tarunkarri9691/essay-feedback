import { storageService } from '../services/storage.service.js';
import { aiService } from '../services/ai.service.js';
import { TUTOR_SYSTEM, generateSmartFallbackTutor } from '../prompts/tutor.prompts.js';

export async function handleChat(req, res) {
  const { message, messages, conversation_id, subject = 'General', difficulty = 'Intermediate', language = 'English' } = req.body;
  if (!message) return res.status(400).json({ detail: 'Message is required' });

  let conversation;
  if (conversation_id) {
    conversation = storageService.getConversation(req.user.id, conversation_id);
  }
  if (!conversation) {
    conversation = {
      id: 'conv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      user_id: req.user.id,
      subject,
      title: message.substring(0, 50),
      messages: [],
      created_at: new Date().toISOString()
    };
    storageService.saveConversation(conversation);
  }

  const formattedHistory = (messages && Array.isArray(messages) && messages.length > 0)
    ? messages.slice(-12).map(m => ({ role: m.role, content: m.content || m.raw }))
    : conversation.messages.slice(-12).map(m => ({ role: m.role, content: m.raw || m.content }));
  formattedHistory.push({ role: 'user', content: message });

  const systemPrompt = TUTOR_SYSTEM
    .replace('{subject}', subject)
    .replace('{difficulty}', difficulty)
    .replace('{language}', language);

  let answer = '';
  const rawAI = await aiService.getAIResponse(systemPrompt, formattedHistory, 4000);

  if (rawAI) {
    const match = rawAI.match(/<answer>([\s\S]*?)(<\/answer>|$)/i);
    answer = match ? match[1].trim() : rawAI.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '').trim();
    answer = answer.replace(/<\/?answer>/gi, '').trim();
  } else {
    answer = generateSmartFallbackTutor(message, subject, difficulty, language);
  }

  const now = new Date().toISOString();
  conversation.messages.push(
    { role: 'user', content: message, raw: message, language, at: now },
    { role: 'assistant', content: answer, raw: answer, language, at: now }
  );

  storageService.saveConversation(conversation);

  storageService.addProgress({
    id: 'prg_' + Date.now(),
    user_id: req.user.id,
    type: 'tutor',
    subject,
    language,
    date: now
  });

  res.json({
    conversation_id: conversation.id,
    answer,
    reply: answer
  });
}

export function getConversations(req, res) {
  const list = storageService.getConversations(req.user.id);
  res.json(list.slice(0, 30));
}

export function getConversationById(req, res) {
  const conversation = storageService.getConversation(req.user.id, req.params.cid);
  if (!conversation) return res.status(404).json({ detail: 'Not found' });
  res.json({
    id: conversation.id,
    messages: conversation.messages.map(m => ({ role: m.role, content: m.content }))
  });
}

export function updateConversationTitle(req, res) {
  const { title } = req.body;
  if (!title) return res.status(400).json({ detail: 'Title is required' });
  const updated = storageService.updateConversationTitle(req.user.id, req.params.cid, title.trim());
  if (!updated) return res.status(404).json({ detail: 'Conversation not found' });
  res.json({ success: true, conversation: updated });
}

export function deleteConversation(req, res) {
  const success = storageService.deleteConversation(req.user.id, req.params.cid);
  if (!success) return res.status(404).json({ detail: 'Conversation not found' });
  res.json({ success: true });
}

export function logFeedback(req, res) {
  const { conversation_id, message_index, feedback_type, user_message, assistant_message } = req.body;
  storageService.addFeedback({
    id: 'fb_' + Date.now(),
    user_id: req.user.id,
    conversation_id,
    message_index,
    feedback_type,
    user_message,
    assistant_message,
    created_at: new Date().toISOString()
  });
  res.json({ success: true });
}
