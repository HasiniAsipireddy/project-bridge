import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import morgan from 'morgan';

import { env } from './config/env.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { authRouter } from './routes/auth.js';
import { projectsRouter } from './routes/projects.js';
import { requestsRouter } from './routes/requests.js';
import { usersRouter } from './routes/users.js';

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.clientOrigin, credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

  app.use('/api/auth', authRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/projects', projectsRouter);
  // Mounted at /api because its paths straddle /projects/:id/requests,
  // /requests/:id and /my-requests. Unmatched /api/projects/* requests fall
  // through from projectsRouter to here.
  app.use('/api', requestsRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
