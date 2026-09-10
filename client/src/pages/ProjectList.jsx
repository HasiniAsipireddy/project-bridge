import { Link } from 'react-router-dom';

import { useApi } from '../hooks/useApi';

function truncate(text, limit = 160) {
  return text.length > limit ? `${text.slice(0, limit).trimEnd()}…` : text;
}

export function ProjectList() {
  const { data, error, loading } = useApi('/projects');

  const projects = data?.projects ?? [];

  return (
    <section className="page">
      <h1>Projects</h1>
      <p className="muted">Browse what innovators are building.</p>

      {loading && <p data-testid="loading">Loading projects…</p>}
      {error && <p className="error">{error.message}</p>}

      {!loading && !error && projects.length === 0 && (
        <p className="muted" data-testid="empty">
          No projects yet
        </p>
      )}

      {projects.length > 0 && (
        <ul className="card-grid" data-testid="project-list">
          {projects.map((project) => (
            <li key={project.id} className="card" data-testid="project-card">
              <h2>
                <Link to={`/projects/${project.id}`}>{project.title}</Link>
              </h2>
              <p>{truncate(project.description)}</p>
              <ul className="tags">
                {project.tech_stack.map((tech) => (
                  <li key={tech} className="tag">
                    {tech}
                  </li>
                ))}
              </ul>
              <p className="muted">by {project.owner.name}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
