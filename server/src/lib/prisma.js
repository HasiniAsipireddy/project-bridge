import { PrismaClient } from '@prisma/client';

import { env } from '../config/env.js';

// Reuse a single client across hot reloads in development so we don't
// exhaust the Postgres connection pool.
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.nodeEnv === 'development' ? ['query', 'warn', 'error'] : ['error'],
  });

if (env.nodeEnv !== 'production') {
  globalForPrisma.prisma = prisma;
}
