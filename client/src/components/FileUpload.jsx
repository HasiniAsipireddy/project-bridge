import { useRef, useState } from 'react';

import { useUpload } from '../hooks/useUpload';

/**
 * File input + upload button for one endpoint.
 *
 * `accept` only filters the picker — the server re-checks extension, MIME type
 * and the file's own signature, so nothing here is a security boundary.
 * `onUploaded` receives the server response so the page can refresh what it
 * shows (a presigned URL expires, the key behind it does not).
 */
export function FileUpload({ label, hint, path, accept, onUploaded, testId }) {
  const { upload, uploading, error } = useUpload(path);
  const [file, setFile] = useState(null);
  const [done, setDone] = useState(false);
  const inputRef = useRef(null);

  async function handleSubmit(event) {
    event.preventDefault();

    const result = await upload(file);
    if (!result) return;

    setDone(true);
    setFile(null);
    // Clear the native input too, or the filename lingers next to a cleared
    // state and the same pick won't re-fire onChange.
    if (inputRef.current) inputRef.current.value = '';
    onUploaded?.(result);
  }

  return (
    <form className="form" onSubmit={handleSubmit} data-testid={testId}>
      <label>
        {label}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={(event) => {
            setFile(event.target.files?.[0] ?? null);
            setDone(false);
          }}
        />
      </label>
      {hint && <p className="muted">{hint}</p>}

      <div className="actions">
        <button type="submit" disabled={!file || uploading} data-testid={`${testId}-submit`}>
          {uploading ? 'Uploading…' : 'Upload'}
        </button>
      </div>

      {error && (
        <p className="error" data-testid={`${testId}-error`}>
          {error}
        </p>
      )}
      {done && !error && (
        <p className="muted" data-testid={`${testId}-success`}>
          Uploaded.
        </p>
      )}
    </form>
  );
}
