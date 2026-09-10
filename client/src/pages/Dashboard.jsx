import { useState } from 'react';
import { Link } from 'react-router-dom';

import { useApi } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';
import { apiFetch } from '../lib/api';

function parseTechStack(value) {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

/**
 * Requests coming in on one project. Kept as its own component so each project
 * owns its fetch and its optimistic updates after accept/reject.
 */
function IncomingRequests({ projectId }) {
  const { data, error, loading, setData } = useApi(`/projects/${projectId}/requests`);
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState(null);

  const requests = data?.requests ?? [];

  async function decide(requestId, status) {
    setBusyId(requestId);
    setActionError(null);

    try {
      const result = await apiFetch(`/requests/${requestId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      // Patch the row in place so the list doesn't refetch or lose scroll.
      setData((prev) => ({
        requests: prev.requests.map((request) =>
          request.id === requestId ? { ...request, status: result.request.status } : request,
        ),
      }));
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  if (loading)
    return (
      <p className="muted" data-testid="loading">
        Loading requests…
      </p>
    );
  if (error) return <p className="error">{error.message}</p>;
  if (requests.length === 0) return <p className="muted">No requests yet.</p>;

  return (
    <>
      <ul className="request-list">
        {requests.map((request) => (
          <li key={request.id} data-testid={`request-${request.id}`}>
            <strong>{request.student.name}</strong>
            <span className="muted">{request.student.email}</span>
            <span className={`badge badge-${request.status}`} data-testid={`status-${request.id}`}>
              {request.status}
            </span>
            {request.message && <span className="muted">“{request.message}”</span>}

            {request.status === 'pending' && (
              <span className="actions">
                <button
                  type="button"
                  onClick={() => decide(request.id, 'accepted')}
                  disabled={busyId === request.id}
                  data-testid={`accept-${request.id}`}
                >
                  Accept
                </button>
                <button
                  type="button"
                  onClick={() => decide(request.id, 'rejected')}
                  disabled={busyId === request.id}
                  data-testid={`reject-${request.id}`}
                >
                  Reject
                </button>
              </span>
            )}
          </li>
        ))}
      </ul>
      {actionError && <p className="error">{actionError}</p>}
    </>
  );
}

export function Dashboard() {
  const { user } = useAuth();
  const { data, error, loading, reload } = useApi('/projects');

  const [form, setForm] = useState({ title: '', description: '', tech_stack: '' });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  // The API has no "my projects" endpoint, so filter the public list by owner.
  const myProjects = (data?.projects ?? []).filter((project) => project.owner_id === user.id);

  async function handleCreate(event) {
    event.preventDefault();
    setCreating(true);
    setCreateError(null);

    try {
      await apiFetch('/projects', {
        method: 'POST',
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          tech_stack: parseTechStack(form.tech_stack),
        }),
      });
      setForm({ title: '', description: '', tech_stack: '' });
      reload();
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <section className="page">
      <h1>Dashboard</h1>
      <p className="muted">Your projects and the requests coming in on them.</p>

      <div className="panel">
        <h2>Create new project</h2>
        <form className="form" onSubmit={handleCreate} data-testid="create-form">
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
              placeholder="react, node, postgres"
              required
            />
          </label>
          <div className="actions">
            <button type="submit" disabled={creating} data-testid="create-submit">
              {creating ? 'Creating…' : 'Create project'}
            </button>
          </div>
        </form>
        {createError && (
          <p className="error" data-testid="create-error">
            {createError}
          </p>
        )}
      </div>

      {loading && <p data-testid="loading">Loading your projects…</p>}
      {error && <p className="error">{error.message}</p>}

      {!loading && !error && myProjects.length === 0 && (
        <p className="muted" data-testid="empty">
          You haven&apos;t created any projects yet.
        </p>
      )}

      {myProjects.map((project) => (
        <div key={project.id} className="panel" data-testid={`own-project-${project.id}`}>
          <div className="row-between">
            <h2>
              <Link to={`/projects/${project.id}`}>{project.title}</Link>
            </h2>
            <ul className="tags">
              {project.tech_stack.map((tech) => (
                <li key={tech} className="tag">
                  {tech}
                </li>
              ))}
            </ul>
          </div>
          <IncomingRequests projectId={project.id} />
        </div>
      ))}
    </section>
  );
}
