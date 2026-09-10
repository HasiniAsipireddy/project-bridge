import { useCallback, useEffect, useMemo, useState } from 'react';

import { AuthContext } from '../hooks/useAuth';
import { apiFetch } from '../lib/api';

/**
 * Holds the signed-in user. The session lives in an httpOnly cookie, so the
 * only way to know who we are on a fresh page load is to ask the server —
 * hence the GET /auth/me probe on mount, and `loading` to stop routes from
 * deciding anything before it resolves.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    apiFetch('/auth/me')
      .then((data) => {
        if (!cancelled) setUser(data.user);
      })
      .catch(() => {
        // A 401 here is the normal "not signed in" case, not an error.
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (details) => {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(details),
    });
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    await apiFetch('/auth/logout', { method: 'POST' });
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
