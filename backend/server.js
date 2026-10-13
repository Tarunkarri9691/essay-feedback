import app from './src/app.js';
import { config } from './src/config/env.js';
import { connectMongo } from './src/config/db.js';

async function startServer() {
  await connectMongo();

  app.listen(config.port, () => {
    console.log(`StudyMate AI Server running on http://localhost:${config.port}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
