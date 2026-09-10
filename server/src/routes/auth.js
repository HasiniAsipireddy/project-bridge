import bcrypt from 'bcrypt';
import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../lib/prisma.js';
import { clearAuthCookie, setAuthCookie, signToken } from '../lib/token.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validateBody } from '../middleware/validate.js';

const BCRYPT_ROUNDS = 12;

const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  email: z.email().trim().toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72),
  role: z.enum(['innovator', 'student']),
});

const loginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

/** Shape a User row for the wire — never leak password_hash. */
function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export const authRouter = Router();

authRouter.post('/register', validateBody(registerSchema), async (req, res, next) => {
  const { name, email, password, role } = req.body;

  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        role,
        password_hash: await bcrypt.hash(password, BCRYPT_ROUNDS),
      },
    });

    setAuthCookie(res, signToken(user));
    return res.status(201).json({ user: publicUser(user) });
  } catch (err) {
    // Unique constraint on User.email — the DB is the only race-free place to
    // detect this, so we let it fail and translate the error.
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'An account with that email already exists' });
    }
    return next(err);
  }
});

authRouter.post('/login', validateBody(loginSchema), async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    // Compare against a dummy hash when the user is missing so the response
    // time doesn't reveal whether the email exists.
    const hash = user?.password_hash ?? '$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinvalid';
    const passwordMatches = await bcrypt.compare(password, hash);

    if (!user || !passwordMatches) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    setAuthCookie(res, signToken(user));
    return res.json({ user: publicUser(user) });
  } catch (err) {
    return next(err);
  }
});

authRouter.post('/logout', (req, res) => {
  clearAuthCookie(res);
  return res.status(204).end();
});

authRouter.get('/me', requireAuth, (req, res) => {
  return res.json({ user: req.user });
});
