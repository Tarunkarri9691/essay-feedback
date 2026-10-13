import { aiService } from '../services/ai.service.js';
import { TRANSLATE_SYSTEM, generateSmartTranslation } from '../prompts/translate.prompts.js';

export async function handleTranslate(req, res) {
  const { text, sourceLang = 'English', targetLang = 'Telugu' } = req.body;
  if (!text) return res.status(400).json({ detail: 'Text is required' });

  const systemPrompt = TRANSLATE_SYSTEM
    .replace('{sourceLang}', sourceLang)
    .replace('{targetLang}', targetLang);

  const rawAI = await aiService.getAIResponse(systemPrompt, [{ role: 'user', content: text }], 1500);

  let result;
  if (rawAI) {
    try {
      const match = rawAI.match(/<translation>(.*?)<\/translation>/s) || rawAI.match(/\{.*\}/s);
      if (match) result = JSON.parse(match[1] || match[0]);
    } catch (e) {
      // fallback
    }
  }

  if (!result || !result.translatedText) {
    result = generateSmartTranslation(text, sourceLang, targetLang);
  }

  res.json({
    sourceLang,
    targetLang,
    originalText: text,
    translatedText: result.translatedText,
    reply: result.translatedText,
    vocabulary: result.vocabulary || [],
    ...result
  });
}
