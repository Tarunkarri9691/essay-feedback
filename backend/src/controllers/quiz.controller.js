import { storageService } from '../services/storage.service.js';
import { aiService } from '../services/ai.service.js';
import { getQuizPrompt, generateFallbackQuiz } from '../prompts/quiz.prompts.js';

export async function handleQuizGenerate(req, res) {
  const {
    topic = '',
    subject = 'General Knowledge',
    difficulty = 'Intermediate',
    language = 'Telugu',
    count = 20,
    seed = Date.now().toString()
  } = req.body;

  const targetTopic = (topic || subject || 'General Knowledge').trim();
  const numQuestions = Math.min(Math.max(parseInt(count) || 20, 1), 25);

  let quizData = null;

  if (aiService.isAvailable()) {
    const prompt = getQuizPrompt(targetTopic, difficulty, language, numQuestions, seed);
    const parsed = await aiService.generateJSON(prompt, 7500);

    if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
      const cleanQuestions = parsed.questions.slice(0, numQuestions).map((q, idx) => ({
        id: idx + 1,
        question: q.question || `Question ${idx + 1}`,
        options: Array.isArray(q.options) && q.options.length >= 4 ? q.options.slice(0, 4) : ['A', 'B', 'C', 'D'],
        answerIndex: typeof q.answerIndex === 'number' && q.answerIndex >= 0 && q.answerIndex < 4 ? q.answerIndex : 0,
        explanation: q.explanation || 'Solution explained above.'
      }));

      quizData = {
        id: 'qz_' + Date.now(),
        title: parsed.title || `${targetTopic} Quiz (${difficulty})`,
        subject: targetTopic,
        difficulty,
        language,
        questions: cleanQuestions
      };
    }
  }

  if (!quizData || !quizData.questions || quizData.questions.length === 0) {
    quizData = generateFallbackQuiz(targetTopic, subject, difficulty, language, numQuestions, seed);
  }

  res.json(quizData);
}

export function handleQuizSubmit(req, res) {
  const { subject, answers, totalQuestions } = req.body;
  const correctCount = (answers || []).filter(a => a && a.isCorrect).length;
  const total = totalQuestions || 4;
  const score = Math.round((correctCount / total) * 100);

  storageService.addProgress({
    id: 'prg_q_' + Date.now(),
    user_id: req.user.id,
    type: 'quiz',
    subject: subject || 'Quiz',
    score,
    date: new Date().toISOString()
  });

  res.json({
    success: true,
    score,
    correctCount,
    totalQuestions: total
  });
}
