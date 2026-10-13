import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: process.env.PORT || 8000,
  jwtSecret: process.env.JWT_SECRET || 'studymate-secret-key-2026',
  model: process.env.MODEL || 'gemini-3.8-flash',
  googleApiKey: process.env.GOOGLE_API_KEY || '',
  mongoUri: process.env.MONGO_URI || '',
  dbName: process.env.DB_NAME || 'studymate_ai',
  corsOrigin: process.env.CORS_ORIGIN || '*'
};
