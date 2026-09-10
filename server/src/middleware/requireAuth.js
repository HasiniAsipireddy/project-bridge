import { AUTH_COOKIE, verifyToken } from '../lib/token.js';

/**
 * Reads the session JWT from its httpOnly cookie and attaches { id, role } to
 * req.user. Responds 401 if the cookie is absent, malformed, or expired.
 *
 * Requires cookieParser() to have run first (see app.js).
 */
export function requireAuth(req, res, next) {
  const token = req.cookies?.[AUTH_COOKIE];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, role: payload.role };
    return next();
  } catch {
    // Covers both a bad signature and an expired token. Deliberately vague —
    // the client only needs to know it has to log in again.
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}
