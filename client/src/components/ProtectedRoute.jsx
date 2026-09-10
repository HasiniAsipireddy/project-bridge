import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';

/**
 * Gates a route on being signed in, and optionally on a role.
 *
 *   <ProtectedRoute role="innovator"><Dashboard /></ProtectedRoute>
 *
 * Waits for the auth probe before redirecting — without that, a refresh on a
 * protected page bounces to /login before the cookie check has finished.
 */
export function ProtectedRoute({ role, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <p>Checking your session…</p>;
  }

  if (!user) {
    // Remember where they were headed so login can send them back.
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
}
