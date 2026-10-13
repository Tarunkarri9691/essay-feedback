import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { config } from './env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.resolve(__dirname, '../../edulinga_db.json');
const SEED_FILE = path.resolve(__dirname, '../../data/seed.json');

export async function connectMongo() {
  if (config.mongoUri && !config.mongoUri.includes('<db_password>')) {
    try {
      await mongoose.connect(config.mongoUri, { dbName: config.dbName });
      console.log('✅ Connected to MongoDB Atlas');
    } catch (err) {
      console.error('❌ MongoDB connection error:', err.message);
    }
  } else {
    console.warn('⚠️  MONGO_URI not configured — using local JSON file storage.');
  }
}

export function loadJSONDatabase() {
  if (!fs.existsSync(DB_FILE)) {
    let initial = { users: [], conversations: [], essays: [], progress: [], flashcards: [], feedback: [] };
    if (fs.existsSync(SEED_FILE)) {
      try {
        initial = JSON.parse(fs.readFileSync(SEED_FILE, 'utf-8'));
      } catch (e) {
        // use default initial
      }
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }

  try {
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    if (!data.users) data.users = [];
    if (!data.conversations) data.conversations = [];
    if (!data.essays) data.essays = [];
    if (!data.progress) data.progress = [];
    if (!data.flashcards) data.flashcards = [];
    if (!data.feedback) data.feedback = [];
    return data;
  } catch (e) {
    console.error('Error reading JSON DB, initializing fallback:', e.message);
    return { users: [], conversations: [], essays: [], progress: [], flashcards: [], feedback: [] };
  }
}

export function saveJSONDatabase(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing to JSON DB:', err.message);
  }
}
