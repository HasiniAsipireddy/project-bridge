import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validateBody } from '../middleware/validate.js';

/** Profile fields safe to return — never password_hash. */
const profileSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  bio: true,
  skills: true,
  project_links: true,
};

const updateProfileSchema = z
  .object({
    // Nullable so a student can clear the field, not just overwrite it.
    bio: z.string().trim().max(2000).nullable(),
    skills: z.array(z.string().trim().min(1, 'Skills cannot be blank').max(60)).max(50),
    project_links: z.array(z.url('Must be a valid URL').max(500)).max(20),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Provide at least one of: bio, skills, project_links',
  });

export const usersRouter = Router();

// Readable by any signed-in user. Innovators simply see the defaults.
usersRouter.get('/me/profile', requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: profileSelect,
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    return res.json({ profile: user });
  } catch (err) {
    return next(err);
  }
});

usersRouter.patch(
  '/me/profile',
  requireAuth,
  requireRole('student'),
  validateBody(updateProfileSchema),
  async (req, res, next) => {
    try {
      // req.body is already narrowed to the three profile fields by the schema,
      // so there's no way to write role or password_hash through here.
      const user = await prisma.user.update({
        where: { id: req.user.id },
        data: req.body,
        select: profileSelect,
      });

      return res.json({ profile: user });
    } catch (err) {
      // Token valid but the account is gone.
      if (err.code === 'P2025') {
        return res.status(401).json({ error: 'Invalid or expired session' });
      }
      return next(err);
    }
  },
);
