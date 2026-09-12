import jwt from 'jsonwebtoken';

import { env, isProduction } from '../config/env.js';

export const AUTH_COOKIE = 'token';

/**
 * Sign a session token. The payload is deliberately minimal — id and role are
 * all the guards need, and anything else would go stale the moment the user
 * edits their profile.
 */
export function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

export function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

/**
 * Sets the session cookie, deriving its lifetime from the token's own `exp`
 * claim so the cookie and the JWT can never disagree about when the session
 * ends.
 */
export function setAuthCookie(res, token) {
  const { exp } = jwt.decode(token);

  res.cookie(AUTH_COOKIE, token, {
    httpOnly: true,
    // 'none' so the cookie survives a cross-origin deploy (client and API on
    // separate hosts). Browsers only accept it alongside `secure`, which the
    // same `isProduction` flag turns on — the two can't drift apart.
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction,
    maxAge: exp * 1000 - Date.now(),
    path: '/',
  });
}

export function clearAuthCookie(res) {
  // Must mirror the attributes used above, or browsers keep the original cookie.
  res.clearCookie(AUTH_COOKIE, {
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction,
    path: '/',
  });
}
