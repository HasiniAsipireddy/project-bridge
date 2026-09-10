import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validateBody } from '../middleware/validate.js';

/** Owner fields safe to expose on a public listing. */
const ownerSelect = { select: { id: true, name: true } };

const createProjectSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().trim().min(1, 'Description is required').max(5000),
  tech_stack: z.array(z.string()).min(1, 'List at least one technology'),
});

// Every field optional for a PATCH, but an empty body is a client mistake
// rather than a no-op we should silently accept.
const updateProjectSchema = createProjectSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Provide at least one of: title, description, tech_stack' },
);

/**
 * Loads the project and confirms req.user owns it. Returns null after
 * responding, so callers can `if (!project) return;`.
 */
async function loadOwnedProject(req, res) {
  const project = await prisma.project.findUnique({ where: { id: req.params.id } });

  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return null;
  }

  if (project.owner_id !== req.user.id) {
    res.status(403).json({ error: 'You can only modify your own projects' });
    return null;
  }

  return project;
}

export const projectsRouter = Router();

// Public: anyone can browse projects, logged in or not.
projectsRouter.get('/', async (req, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { created_at: 'desc' },
      include: { owner: ownerSelect },
    });
    return res.json({ projects });
  } catch (err) {
    return next(err);
  }
});

projectsRouter.get('/:id', async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        owner: ownerSelect,
        _count: { select: { requests: true } },
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const { _count, ...rest } = project;
    return res.json({ project: { ...rest, request_count: _count.requests } });
  } catch (err) {
    return next(err);
  }
});

projectsRouter.post(
  '/',
  requireAuth,
  requireRole('innovator'),
  validateBody(createProjectSchema),
  async (req, res, next) => {
    try {
      const project = await prisma.project.create({
        data: { ...req.body, owner_id: req.user.id },
        include: { owner: ownerSelect },
      });
      return res.status(201).json({ project });
    } catch (err) {
      return next(err);
    }
  },
);

projectsRouter.patch(
  '/:id',
  requireAuth,
  requireRole('innovator'),
  validateBody(updateProjectSchema),
  async (req, res, next) => {
    try {
      if (!(await loadOwnedProject(req, res))) return undefined;

      const project = await prisma.project.update({
        where: { id: req.params.id },
        data: req.body,
        include: { owner: ownerSelect },
      });
      return res.json({ project });
    } catch (err) {
      return next(err);
    }
  },
);

projectsRouter.delete('/:id', requireAuth, requireRole('innovator'), async (req, res, next) => {
  try {
    if (!(await loadOwnedProject(req, res))) return undefined;

    // Requests cascade via the FK, so this also clears any pending ones.
    await prisma.project.delete({ where: { id: req.params.id } });
    return res.status(204).end();
  } catch (err) {
    return next(err);
  }
});
