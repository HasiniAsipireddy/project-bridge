import { useCallback, useState } from 'react';

import { apiFetch } from '../lib/api';

/**
 * POST a single file as multipart/form-data and track the three states a file
 * input needs: uploading, failed, succeeded.
 *
 * The server answers with a presigned URL, so `data` is directly renderable —
 * callers don't have to build a URL from a key.
 */
export function useUpload(path) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const upload = useCallback(
    async (file) => {
      if (!file) return null;

      setUploading(true);
      setError(null);

      try {
        const body = new FormData();
        // Field name must be "file" — that's what the router's multer
        // .single('file') looks for.
        body.append('file', file);

        const result = await apiFetch(path, { method: 'POST', body });
        setData(result);
        return result;
      } catch (err) {
        // The server sends per-field messages for rejected files (wrong type,
        // too large); surface those rather than the generic status text.
        const fieldMessage = Object.values(err.body?.fields ?? {})
          .flat()
          .join(' ');
        setError(fieldMessage || err.message);
        return null;
      } finally {
        setUploading(false);
      }
    },
    [path],
  );

  return { upload, uploading, error, data, reset: () => setError(null) };
}
