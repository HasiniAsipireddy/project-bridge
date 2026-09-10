import { useCallback, useEffect, useState } from 'react';

import { apiFetch } from '../lib/api';

/**
 * GET a path and track loading/error alongside the data, so pages don't each
 * reimplement the same three states.
 *
 * `skip` leaves the request unmade — used for calls that only apply to one
 * role, e.g. /my-requests when the viewer isn't a student.
 * `setData` lets callers patch the cache after a mutation instead of refetching.
 */
export function useApi(path, { skip = false } = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(!skip);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    // `loading` is initialised from `skip`, so there's nothing to reset here.
    if (skip) return undefined;

    let cancelled = false;
    // Deliberate: a new path must show a loading state rather than keep
    // rendering the previous path's data as though it were current.
    // oxlint-disable-next-line react/set-state-in-effect
    setLoading(true);
    setError(null);

    apiFetch(path)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [path, skip, reloadCount]);

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);

  return { data, setData, error, loading, reload };
}
