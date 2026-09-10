import { Link } from 'react-router-dom';

import { useApi } from '../hooks/useApi';

export function MyRequests() {
  const { data, error, loading } = useApi('/my-requests');

  const requests = data?.requests ?? [];

  return (
    <section className="page">
      <h1>My requests</h1>
      <p className="muted">Projects you have asked to join.</p>

      {loading && <p data-testid="loading">Loading your requests…</p>}
      {error && <p className="error">{error.message}</p>}

      {!loading && !error && requests.length === 0 && (
        <p className="muted" data-testid="empty">
          You haven&apos;t requested to join any projects yet.
        </p>
      )}

      {requests.length > 0 && (
        <ul className="request-list" data-testid="my-requests">
          {requests.map((request) => (
            <li key={request.id} data-testid="my-request">
              <Link to={`/projects/${request.project_id}`}>{request.project.title}</Link>
              <span className="muted">by {request.project.owner.name}</span>
              <span
                className={`badge badge-${request.status}`}
                data-testid={`status-${request.project_id}`}
              >
                {request.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
