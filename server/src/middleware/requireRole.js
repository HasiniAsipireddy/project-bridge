/**
 * Gate a route on the caller's role, e.g.
 *   router.post('/', requireAuth, requireRole('innovator'), createProject)
 *
 * Must be mounted after requireAuth, which is what populates req.user.
 */
export function requireRole(role) {
  return function roleGuard(req, res, next) {
    if (!req.user) {
      // A programming error rather than a client one: requireAuth is missing.
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role !== role) {
      return res.status(403).json({ error: `This action requires the ${role} role` });
    }

    return next();
  };
}
