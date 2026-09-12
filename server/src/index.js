// Secrets first, then everything else. The imports below are dynamic on
// purpose: static ESM imports are evaluated before any statement in this file,
// and config/env.js validates the moment it is imported — it has to see the
// Secrets Manager values, not just what .env happened to provide.
import { loadSecrets } from './lib/loadSecrets.js';

await loadSecrets();

const { createApp } = await import('./app.js');
const { env } = await import('./config/env.js');
const { prisma } = await import('./lib/prisma.js');

const app = createApp();
const server = app.listen(env.port, () => {
  console.log(`Server listening on http://localhost:${env.port}`);
});

async function shutdown(signal) {
  console.log(`\n${signal} received, shutting down.`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
