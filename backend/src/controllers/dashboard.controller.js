import { storageService } from '../services/storage.service.js';

export function getDashboard(req, res) {
  const userProgress = storageService.getUserProgress(req.user.id);
  const userEssays = storageService.getEssays(req.user.id);
  const questionsCount = userProgress.filter(p => p.type === 'tutor').length;
  const languagesSet = new Set(userProgress.map(p => p.language).filter(Boolean));
  const scores = userEssays.map(e => e.score).filter(s => typeof s === 'number');
  const avgScore = scores.length
    ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
    : 0;

  const trend = userEssays.map(e => ({
    title: (e.title || 'Essay').substring(0, 14),
    score: e.score,
    grammar: e.feedback?.grammar || 0,
    vocabulary: e.feedback?.vocabulary || 0,
    coherence: e.feedback?.coherence || 0,
    structure: e.feedback?.structure || 0,
    originality: e.feedback?.originality || 0
  }));

  res.json({
    questions: questionsCount,
    essays: userEssays.length,
    languages: languagesSet.size,
    avg_score: avgScore,
    trend
  });
}
