import { useParams } from 'react-router-dom';

// Stub: routing shell only. Will load GET /api/projects/:id.
export function ProjectDetail() {
  const { id } = useParams();

  return (
    <section>
      <h1>Project detail</h1>
      {/* Echoed so we can confirm the URL param reaches the page. */}
      <p data-testid="project-id">{id}</p>
    </section>
  );
}
