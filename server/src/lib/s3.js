import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { env } from '../config/env.js';

// One client for the process — it holds a connection pool, so rebuilding it per
// request would be wasteful.
export const s3 = new S3Client({
  region: env.aws.region,
  credentials: {
    accessKeyId: env.aws.accessKeyId,
    secretAccessKey: env.aws.secretAccessKey,
  },
});

export const bucket = env.aws.bucket;

/**
 * Build the object key for an upload. Scoping by user id keeps one student's
 * uploads from colliding with another's, and the timestamp means a re-upload
 * writes a new object rather than silently replacing the old one (S3 PUTs are
 * eventually consistent overwrites; a fresh key sidesteps that entirely).
 */
export function buildKey(prefix, userId, extension) {
  return `${prefix}/${userId}-${Date.now()}${extension}`;
}

/**
 * Stream a buffer straight to S3. Nothing touches disk.
 * Throws whatever the SDK throws — callers translate it into a 5xx.
 */
export async function putObject({ key, body, contentType }) {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
  return key;
}

/**
 * A time-limited GET URL for a private object. We never store or hand out
 * permanent public URLs, so access dies with the signature.
 * Returns null for a null key, which keeps callers free of branching.
 */
export async function getPresignedUrl(key, expiresIn = env.s3UrlExpiresIn) {
  if (!key) return null;
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn });
}
