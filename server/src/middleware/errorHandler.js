import { env } from '../config/env.js';

export function notFound(req, res) {
  res.status(404).json({ error: `Not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars -- Express identifies error handlers by arity.
export function errorHandler(err, req, res, next) {
  const status = err.status ?? 500;
  res.status(status).json({
    error: status === 500 && env.nodeEnv === 'production' ? 'Internal server error' : err.message,
    ...(env.nodeEnv === 'development' ? { stack: err.stack } : {}),
  });
}
