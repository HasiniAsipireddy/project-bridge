import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validateBody } from '../middleware/validate.js';

const studentSelect = { select: { id: true, name: true, email: true } };
const ownerSelect = { select: { id: true, name: true } };

const createRequestSchema = z.object({
  message: z.string().trim().max(1000).optional(),
});

// 'pending' is deliberately excluded — a decision can't be un-made by
// reverting to the initial state.
const updateRequestSchema = z.object({
  status: z.enum(['accepted', 'rejected']),
});

/**
 * Mounted at /api, so these paths span both /projects/:id/requests and
 * /requests/:id. Project-scoped reads live here rather than in projects.js
 * because they return Requests and share this file's shaping.
 */
export const requestsRouter = Router();

requestsRouter.post(
  '/projects/:id/requests',
  requireAuth,
  requireRole('student'),
  validateBody(createRequestSchema),
  async (req, res, next) => {
    try {
      // Checked up front so a missing project reads as 404 rather than
      // surfacing as an opaque foreign-key violation.
      const project = await prisma.project.findUnique({ where: { id: req.params.id } });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const request = await prisma.request.create({
        data: {
          student_id: req.user.id,
          project_id: project.id,
          message: req.body.message ?? null,
        },
      });

      return res.status(201).json({ request });
    } catch (err) {
      // Unique constraint on (student_id, project_id). The DB is the only
      // race-free place to enforce one request per student per project.
      if (err.code === 'P2002') {
        return res.status(409).json({ error: 'You have already requested to join this project' });
      }
      return next(err);
    }
  },
);

requestsRouter.get(
  '/projects/:id/requests',
  requireAuth,
  requireRole('innovator'),
  async (req, res, next) => {
    try {
      const project = await prisma.project.findUnique({ where: { id: req.params.id } });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      if (project.owner_id !== req.user.id) {
        return res.status(403).json({ error: 'You can only view requests for your own projects' });
      }

      const requests = await prisma.request.findMany({
        where: { project_id: project.id },
        orderBy: { created_at: 'desc' },
        include: { student: studentSelect },
      });

      return res.json({ requests });
    } catch (err) {
      return next(err);
    }
  },
);

requestsRouter.patch(
  '/requests/:id',
  requireAuth,
  requireRole('innovator'),
  validateBody(updateRequestSchema),
  async (req, res, next) => {
    try {
      const existing = await prisma.request.findUnique({
        where: { id: req.params.id },
        include: { project: { select: { owner_id: true } } },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Request not found' });
      }

      if (existing.project.owner_id !== req.user.id) {
        return res
          .status(403)
          .json({ error: 'You can only respond to requests on your own projects' });
      }

      const request = await prisma.request.update({
        where: { id: existing.id },
        data: { status: req.body.status },
        include: { student: studentSelect },
      });

      return res.json({ request });
    } catch (err) {
      return next(err);
    }
  },
);

requestsRouter.get('/my-requests', requireAuth, requireRole('student'), async (req, res, next) => {
  try {
    const requests = await prisma.request.findMany({
      where: { student_id: req.user.id },
      orderBy: { created_at: 'desc' },
      include: {
        project: { include: { owner: ownerSelect } },
      },
    });

    return res.json({ requests });
  } catch (err) {
    return next(err);
  }
});
