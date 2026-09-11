import { Router } from 'express';
import { z } from 'zod';

import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { getPresignedUrl } from '../lib/s3.js';
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
  resume_key: true,
  profile_picture_key: true,
};

/**
 * Swap the stored S3 keys for short-lived presigned GET URLs. The bucket is
 * private and the keys are an implementation detail, so neither one leaves the
 * server; the client only ever sees a URL that expires.
 */
async function toProfileResponse(user) {
  const { resume_key, profile_picture_key, ...profile } = user;

  const [resumeUrl, pictureUrl] = await Promise.all([
    getPresignedUrl(resume_key),
    getPresignedUrl(profile_picture_key),
  ]);

  return {
    ...profile,
    resume_url: resumeUrl,
    profile_picture_url: pictureUrl,
    // Lets the client know when to refetch rather than render a dead link.
    upload_url_expires_in: env.s3UrlExpiresIn,
  };
}

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

    return res.json({ profile: await toProfileResponse(user) });
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

      return res.json({ profile: await toProfileResponse(user) });
    } catch (err) {
      // Token valid but the account is gone.
      if (err.code === 'P2025') {
        return res.status(401).json({ error: 'Invalid or expired session' });
      }
      return next(err);
    }
  },
);
