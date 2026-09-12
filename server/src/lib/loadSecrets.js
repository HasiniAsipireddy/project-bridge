// Loaded before config/env.js, so this module reads process.env directly
// rather than importing `env` — that module validates on import, and at this
// point the values it validates have not arrived yet.
import 'dotenv/config';

import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';

/** The Secrets Manager secret holding the runtime config. */
export const SECRET_ID = process.env.AWS_SECRETS_ID ?? 'project-bridge';

// Boot shouldn't hang on a slow or unreachable endpoint; past this we fall back
// to whatever .env already provided.
const TIMEOUT_MS = Number(process.env.AWS_SECRETS_TIMEOUT_MS ?? 5000);

/**
 * Pull the secret's key-value pairs into process.env, overriding .env for those
 * specific keys — Secrets Manager is the source of truth when it answers.
 *
 * A failure is a warning, not a crash: local dev without AWS access keeps
 * running on the .env values. That is also why nothing here validates the
 * result; config/env.js still decides what is required, and it runs after us.
 *
 * AWS_REGION and AWS_ACCESS_KEY_ID are deliberately NOT sourced from here —
 * they authenticate this very call, so putting them in the secret would be a
 * chicken-and-egg problem.
 *
 * @returns {Promise<{ loaded: boolean, keys: string[], reason?: string }>}
 */
export async function loadSecrets() {
  const region = process.env.AWS_REGION;

  if (!region) {
    const reason = 'AWS_REGION is not set';
    console.warn(`[secrets] ${reason}; using .env values only.`);
    return { loaded: false, keys: [], reason };
  }

  const client = new SecretsManagerClient({ region, maxAttempts: 2 });

  try {
    const response = await client.send(new GetSecretValueCommand({ SecretId: SECRET_ID }), {
      abortSignal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.SecretString) {
      throw new Error('secret has no SecretString (binary secrets are not supported)');
    }

    const parsed = JSON.parse(response.SecretString);

    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('secret is not a JSON object of key-value pairs');
    }

    const keys = [];
    for (const [key, value] of Object.entries(parsed)) {
      // process.env stringifies anyway; doing it here keeps numbers and
      // booleans in the secret from arriving as "[object Object]" surprises.
      if (value === null || typeof value === 'object') continue;
      process.env[key] = String(value);
      keys.push(key);
    }

    // Names only. Values never reach the log.
    console.log(`[secrets] loaded ${keys.length} value(s) from "${SECRET_ID}": ${keys.join(', ')}`);
    return { loaded: true, keys };
  } catch (err) {
    console.warn(
      `[secrets] could not load "${SECRET_ID}" from Secrets Manager (${err.name}: ${err.message}). ` +
        'Falling back to .env values.',
    );
    return { loaded: false, keys: [], reason: err.message };
  } finally {
    client.destroy();
  }
}
