const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

/**
 * Thin fetch wrapper for the Express API. Throws on non-2xx so callers can
 * rely on the resolved value being the parsed body.
 */
export async function apiFetch(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const body = response.status === 204 ? null : await response.json();

  if (!response.ok) {
    // Callers need the status to tell apart cases that aren't really failures —
    // a 409 on a join request means "already requested", a 404 means the
    // project is gone — so carry it on the error rather than only the message.
    const error = new Error(body?.error ?? `Request failed with status ${response.status}`);
    error.status = response.status;
    error.body = body;
    throw error;
  }

  return body;
}
