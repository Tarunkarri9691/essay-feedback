import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { storageService } from '../services/storage.service.js';

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'Invalid or expired token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = storageService.findUserById(decoded.sub);
    if (!user) {
      return res.status(401).json({ detail: 'User not found' });
    }
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ detail: 'Invalid or expired token' });
  }
}

export function generateToken(userId) {
  return jwt.sign({ sub: userId }, config.jwtSecret, { expiresIn: '7d' });
}
