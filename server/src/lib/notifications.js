import { env } from '../config/env.js';
import { sendEmailInBackground } from './ses.js';

/**
 * The three request-lifecycle emails. Templates live here rather than inline in
 * the router so the routes stay about HTTP and the wording stays in one place.
 *
 * Every function here is fire-and-forget: it returns immediately and a send
 * failure is logged, never propagated. Callers must not await them.
 */

/** Sent to the project owner when a student asks to join. */
export function notifyNewRequest({ innovator, student, project, message }) {
  const lines = [
    `Hi ${innovator.name},`,
    '',
    `${student.name} has requested to join your project "${project.title}".`,
  ];

  if (message) {
    lines.push('', 'Their message:', message);
  }

  lines.push(
    '',
    `Review the request here: ${env.clientOrigin}/projects/${project.id}`,
    '',
    '— Project Bridge',
  );

  sendEmailInBackground(
    innovator.email,
    `New join request for "${project.title}"`,
    lines.join('\n'),
  );
}

/** Sent to the student when the owner accepts or rejects their request. */
export function notifyRequestDecision({ student, innovator, project, status }) {
  const accepted = status === 'accepted';

  const body = [
    `Hi ${student.name},`,
    '',
    accepted
      ? `${innovator.name} accepted your request to join "${project.title}". They will be in touch about next steps.`
      : `${innovator.name} has declined your request to join "${project.title}". Plenty of other projects are looking for students.`,
    '',
    `See your requests here: ${env.clientOrigin}/my-requests`,
    '',
    '— Project Bridge',
  ].join('\n');

  sendEmailInBackground(
    student.email,
    accepted
      ? `Your request to join "${project.title}" was accepted`
      : `Update on your request to join "${project.title}"`,
    body,
  );
}
