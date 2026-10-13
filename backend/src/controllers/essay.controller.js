import { storageService } from '../services/storage.service.js';
import { aiService } from '../services/ai.service.js';
import { extractTextFromImage } from '../services/ocr.service.js';
import {
  ESSAY_SYSTEM,
  isGibberish,
  generateFallbackEssayEvaluation
} from '../prompts/essay.prompts.js';

export async function handleOCR(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ detail: 'No image uploaded' });
    }
    const text = await extractTextFromImage(req.file.buffer);
    if (!text) {
      return res.json({
        extractedText: 'Sample extracted handwritten essay text: The impact of technology on modern education and language learning.'
      });
    }
    res.json({ extractedText: text });
  } catch (err) {
    console.error('OCR Error:', err);
    res.status(500).json({ detail: 'OCR processing failed: ' + err.message });
  }
}

export async function handleEssayEvaluate(req, res) {
  let title = req.body.title || 'Untitled';
  let content = req.body.content || '';
  let feedbackLanguage = req.body.feedback_language || 'English';

  if (req.file) {
    content = req.file.buffer.toString('utf-8');
  }

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  if (wordCount < 30) {
    return res.status(400).json({ detail: 'Essay must be at least 30 words' });
  }

  if (isGibberish(content)) {
    return res.status(422).json({
      detail: 'The submitted text appears to be random or meaningless. Please write a real essay or paragraph (at least 30 meaningful words) to get accurate feedback.'
    });
  }

  const systemPrompt = ESSAY_SYSTEM.replace('{fb_lang}', feedbackLanguage);
  const rawAI = await aiService.getAIResponse(systemPrompt, [{ role: 'user', content: content.substring(0, 12000) }], 3000);

  let feedback;
  if (rawAI) {
    try {
      const jsonMatch = rawAI.split('</reasoning>').pop().match(/\{.*\}/s);
      if (jsonMatch) {
        feedback = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse Gemini JSON:', e);
    }
  }

  if (!feedback) {
    feedback = generateFallbackEssayEvaluation(content, feedbackLanguage);
  }

  const newEssay = {
    id: 'esy_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    user_id: req.user.id,
    title,
    content,
    language: feedback.language || 'English',
    score: feedback.overall || 75,
    feedback,
    created_at: new Date().toISOString()
  };

  storageService.saveEssay(newEssay);

  storageService.addProgress({
    id: 'prg_' + Date.now(),
    user_id: req.user.id,
    type: 'essay',
    score: feedback.overall,
    language: feedback.language,
    date: new Date().toISOString()
  });

  res.json({
    id: newEssay.id,
    title: newEssay.title,
    ...feedback
  });
}

export function getEssays(req, res) {
  const essays = storageService.getEssays(req.user.id);
  res.json(essays);
}
