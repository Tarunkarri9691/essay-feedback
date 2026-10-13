import bcrypt from 'bcryptjs';
import { storageService } from '../services/storage.service.js';
import { generateToken } from '../middleware/auth.middleware.js';

export async function register(req, res) {
  const { name, email, password, preferred_language = 'English' } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ detail: 'Name, email, and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ detail: 'Password must be at least 6 characters' });
  }

  const existing = storageService.findUserByEmail(email);
  if (existing) {
    return res.status(409).json({ detail: 'Email already registered' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = {
    id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    name,
    email: email.toLowerCase(),
    preferred_language,
    password: hashedPassword,
    created_at: new Date().toISOString()
  };

  storageService.createUser(newUser);

  res.json({
    token: generateToken(newUser.id),
    name: newUser.name,
    preferred_language: newUser.preferred_language
  });
}

export async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ detail: 'Email and password required' });
  }

  const user = storageService.findUserByEmail(email);
  if (!user) {
    return res.status(401).json({ detail: 'Wrong email or password' });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(401).json({ detail: 'Wrong email or password' });
  }

  res.json({
    token: generateToken(user.id),
    name: user.name,
    preferred_language: user.preferred_language || 'English'
  });
}

export async function demoLogin(req, res) {
  let demoUser = storageService.findUserByEmail('demo@studymate.ai');
  if (!demoUser) {
    demoUser = {
      id: 'usr_demo_' + Date.now(),
      name: 'Learner Student',
      email: 'demo@studymate.ai',
      preferred_language: 'English',
      password: await bcrypt.hash('demopass123', 10),
      created_at: new Date().toISOString()
    };
    storageService.createUser(demoUser);
  }

  res.json({
    token: generateToken(demoUser.id),
    name: demoUser.name,
    preferred_language: demoUser.preferred_language || 'English'
  });
}

export function getProfile(req, res) {
  const userProgress = storageService.getUserProgress(req.user.id);
  const tutorXp = userProgress.filter(p => p.type === 'tutor').length * 20;
  const essayXp = userProgress.filter(p => p.type === 'essay').length * 50;
  const quizXp = userProgress.filter(p => p.type === 'quiz').length * 30;
  const totalXp = tutorXp + essayXp + quizXp;
  const level = Math.floor(totalXp / 100) + 1;

  res.json({
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    preferred_language: req.user.preferred_language || 'English',
    xp: totalXp,
    level,
    tutorCount: userProgress.filter(p => p.type === 'tutor').length,
    essayCount: userProgress.filter(p => p.type === 'essay').length,
    quizCount: userProgress.filter(p => p.type === 'quiz').length,
    streak: Math.min(7, Math.max(1, userProgress.length ? 3 : 1)),
    created_at: req.user.created_at
  });
}
