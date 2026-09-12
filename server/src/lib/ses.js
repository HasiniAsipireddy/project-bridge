import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses';

import { env } from '../config/env.js';

// One client for the process, same reasoning as the S3 client: it holds a
// connection pool and rebuilding it per send would be wasteful.
export const ses = new SESClient({
  region: env.aws.region,
  credentials: {
    accessKeyId: env.aws.accessKeyId,
    secretAccessKey: env.aws.secretAccessKey,
  },
});

/**
 * Send one plain-text email. Throws whatever the SDK throws — callers that are
 * on a request path should use sendEmailInBackground instead.
 *
 * SES is still in sandbox mode, so anything but a verified recipient fails with
 * MessageRejected. That is expected, not a bug in the caller.
 */
export async function sendEmail(to, subject, body) {
  const result = await ses.send(
    new SendEmailCommand({
      Source: env.ses.fromEmail,
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: subject, Charset: 'UTF-8' },
        Body: { Text: { Data: body, Charset: 'UTF-8' } },
      },
    }),
  );
  return result.MessageId;
}

/**
 * Fire-and-forget send. Nothing in the request lifecycle depends on a
 * notification arriving, so the HTTP response never waits on SES and a failure
 * (unverified sandbox recipient, throttling, network) is logged and dropped.
 *
 * Returns nothing on purpose: awaiting it would defeat the point.
 */
export function sendEmailInBackground(to, subject, body) {
  if (!to) return;

  // Deliberately not awaited. The .catch keeps a rejected promise from
  // surfacing as an unhandled rejection and taking the process down.
  sendEmail(to, subject, body).catch((err) => {
    console.error(`SES send failed (to=${to}, subject="${subject}")`, err);
  });
}
