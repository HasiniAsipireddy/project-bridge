import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useApi } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';
import { apiFetch } from '../lib/api';

function parseTechStack(value) {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data, error, loading, setData } = useApi(`/projects/${id}`);
  const project = data?.project ?? null;

  const isStudent = user?.role === 'student';
  const isOwner = Boolean(project) && user?.id === project.owner_id;

  // Only students have a /my-requests list, and it's the only way to know
  // whether this one has already been requested.
  const myRequests = useApi('/my-requests', { skip: !isStudent });

  const [justRequested, setJustRequested] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', tech_stack: '' });

  // Derived rather than synced through an effect: either the fetched list
  // already contains this project, or we just created the request.
  const alreadyRequested =
    myRequests.data?.requests.some((request) => request.project_id === id) ?? false;
  const requested = justRequested || alreadyRequested;

  function startEditing() {
    setForm({
      title: project.title,
      description: project.description,
      tech_stack: project.tech_stack.join(', '),
    });
    setActionError(null);
    setEditing(true);
  }

  async function handleRequest() {
    setBusy(true);
    setActionError(null);

    try {
      await apiFetch(`/projects/${id}/requests`, { method: 'POST', body: JSON.stringify({}) });
      setJustRequested(true);
    } catch (err) {
      // 409 means a request already exists — the desired end state, not a
      // failure worth showing the user.
      if (err.status === 409) setJustRequested(true);
      else setActionError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveEdit(event) {
    event.preventDefault();
    setBusy(true);
    setActionError(null);

    try {
      const result = await apiFetch(`/projects/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          tech_stack: parseTechStack(form.tech_stack),
        }),
      });
      // PATCH doesn't return request_count, so merge rather than replace.
      setData((prev) => ({ project: { ...prev.project, ...result.project } }));
      setEditing(false);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this project? This cannot be undone.')) return;

    setBusy(true);
    setActionError(null);

    try {
      await apiFetch(`/projects/${id}`, { method: 'DELETE' });
      navigate('/', { replace: true });
    } catch (err) {
      setActionError(err.message);
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <section className="page">
        <p data-testid="loading">Loading project…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="page">
        <h1>{error.status === 404 ? 'Project not found' : 'Something went wrong'}</h1>
        <p className="muted" data-testid="detail-error">
          {error.status === 404
            ? "We couldn't find that project. It may have been deleted."
            : error.message}
        </p>
        <Link to="/">Back to projects</Link>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="row-between">
        <h1 data-testid="project-title">{project.title}</h1>
        {isOwner && !editing && (
          <div className="actions">
            <button type="button" onClick={startEditing} data-testid="edit">
              Edit
            </button>
            <button type="button" onClick={handleDelete} disabled={busy} data-testid="delete">
              Delete
            </button>
          </div>
        )}
      </div>

      <p className="muted">
        by {project.owner.name} · {new Date(project.created_at).toLocaleDateString()}
        {typeof project.request_count === 'number' && ` · ${project.request_count} request(s)`}
      </p>

      {editing ? (
        <form className="form" onSubmit={handleSaveEdit} data-testid="edit-form">
          <label>
            Title
            <input
              name="title"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              required
            />
          </label>
          <label>
            Description
            <textarea
              name="description"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              required
            />
          </label>
          <label>
            Tech stack (comma separated)
            <input
              name="tech_stack"
              value={form.tech_stack}
              onChange={(event) => setForm({ ...form, tech_stack: event.target.value })}
              required
            />
          </label>
          <div className="actions">
            <button type="submit" disabled={busy}>
              {busy ? 'Saving…' : 'Save changes'}
            </button>
            <button type="button" onClick={() => setEditing(false)} disabled={busy}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <p data-testid="project-description">{project.description}</p>
          <ul className="tags" data-testid="project-tech">
            {project.tech_stack.map((tech) => (
              <li key={tech} className="tag">
                {tech}
              </li>
            ))}
          </ul>
        </>
      )}

      {!isOwner && (
        <div className="actions" style={{ marginTop: '1.5rem' }}>
          {!user && <Link to="/login">Log in to request</Link>}

          {/* Until /my-requests lands we don't know whether this project has
              already been requested; showing the button early would flash
              "Request to join" at a student who already applied. */}
          {isStudent && myRequests.loading && (
            <span className="muted" data-testid="loading">
              Checking your requests…
            </span>
          )}

          {isStudent &&
            !myRequests.loading &&
            (requested ? (
              <span className="badge badge-accepted" data-testid="requested">
                Requested
              </span>
            ) : (
              <button type="button" onClick={handleRequest} disabled={busy} data-testid="request">
                {busy ? 'Sending…' : 'Request to join'}
              </button>
            ))}
        </div>
      )}

      {actionError && <p className="error" data-testid="action-error">{actionError}</p>}
    </section>
  );
}
