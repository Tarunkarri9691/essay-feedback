import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import routes from './routes/index.js';
import { errorMiddleware } from './middleware/error.middleware.js';

const app = express();

app.use(cors({
  origin: config.corsOrigin === '*' ? '*' : config.corsOrigin.split(','),
  credentials: true
}));

app.use(express.json());

// Mount application routes
app.use('/', routes);

// Global error handler
app.use(errorMiddleware);

export default app;
