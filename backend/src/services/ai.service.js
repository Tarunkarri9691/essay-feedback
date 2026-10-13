import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env.js';

class AIService {
  constructor() {
    this.llm = config.googleApiKey && config.googleApiKey !== 'your-google-key'
      ? new GoogleGenerativeAI(config.googleApiKey)
      : null;
    this.defaultModel = config.model;
  }

  isAvailable() {
    return !!this.llm;
  }

  async getAIResponse(systemPrompt, messages, maxTokens = 3500) {
    if (!this.llm) return null;
    const candidateModels = ['gemini-3.7-flash', this.defaultModel];

    // 1. Sanitize messages
    const rawList = [];
    if (Array.isArray(messages)) {
      for (const m of messages) {
        if (!m) continue;
        const text = (m.content || m.raw || (m.parts && m.parts[0]?.text) || '').trim();
        if (!text) continue;
        const role = (m.role === 'assistant' || m.role === 'model') ? 'model' : 'user';
        rawList.push({ role, parts: [{ text }] });
      }
    }

    if (rawList.length === 0) return null;

    // 2. Gemini history must start with 'user'
    while (rawList.length > 0 && rawList[0].role === 'model') {
      rawList.shift();
    }
    if (rawList.length === 0) return null;

    // 3. Merge consecutive turns with the same role
    const merged = [];
    for (const item of rawList) {
      if (merged.length > 0 && merged[merged.length - 1].role === item.role) {
        merged[merged.length - 1].parts[0].text += '\n\n' + item.parts[0].text;
      } else {
        merged.push({ role: item.role, parts: [{ text: item.parts[0].text }] });
      }
    }

    // 4. Extract last user message
    const lastItem = merged.pop();
    if (!lastItem || lastItem.role !== 'user') {
      return null;
    }

    for (const modelName of candidateModels) {
      try {
        const geminiModel = this.llm.getGenerativeModel({
          model: modelName,
          systemInstruction: systemPrompt,
          generationConfig: { maxOutputTokens: maxTokens }
        });

        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            const chat = geminiModel.startChat({ history: merged });
            const result = await chat.sendMessage(lastItem.parts[0].text);
            const reply = result.response.text();
            if (reply) return reply;
          } catch (e) {
            console.error(`Gemini (${modelName}, attempt ${attempt}) Error:`, e.message);
            if (attempt < 2 && (e.message.includes('503') || e.message.includes('429') || e.message.includes('high demand'))) {
              await new Promise(r => setTimeout(r, 1200));
              continue;
            }
            break;
          }
        }
      } catch (outerErr) {
        console.warn(`Model ${modelName} setup error:`, outerErr.message);
      }
    }
    return null;
  }

  async generateJSON(prompt, maxTokens = 7500) {
    if (!this.llm) return null;
    const candidateModels = ['gemini-3.7-flash', this.defaultModel];

    for (const modelName of candidateModels) {
      try {
        const geminiModel = this.llm.getGenerativeModel({
          model: modelName,
          generationConfig: {
            maxOutputTokens: maxTokens,
            responseMimeType: 'application/json'
          }
        });

        const result = await geminiModel.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }]
        });

        const rawText = result.response.text();
        if (rawText) {
          return JSON.parse(rawText);
        }
      } catch (err) {
        console.warn(`[AI JSON] Model ${modelName} failed:`, err.message);
        if (err.message.includes('429') || err.message.includes('Quota') || err.message.includes('503')) {
          continue;
        }
      }
    }
    return null;
  }
}

export const aiService = new AIService();
