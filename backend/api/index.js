import app from '../src/app.js';
import { connectMongo } from '../src/config/db.js';

let isDbConnected = false;

export default async function handler(req, res) {
  if (!isDbConnected) {
    try {
      await connectMongo();
      isDbConnected = true;
    } catch (err) {
      console.error('Mongo connection error in serverless handler:', err);
    }
  }
  return app(req, res);
}
