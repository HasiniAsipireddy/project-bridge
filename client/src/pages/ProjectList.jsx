import { Link } from 'react-router-dom';

import { useApi } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';

function truncate(text, limit = 160) {
  return text.length > limit ? `${text.slice(0, limit).trimEnd()}…` : text;
}

/* The bridge: a hairline spanning the gap between the two sides, with a node
   at each end and one in the middle. Horizontal on desktop, vertical once the
   columns stack. */
function Connector() {
  return (
    <>
      <svg
        className="hidden h-6 w-28 md:block"
        viewBox="0 0 112 24"
        aria-hidden="true"
      >
        <line
          x1="4"
          y1="12"
          x2="108"
          y2="12"
          className="stroke-line"
          strokeWidth="1"
        />
        {[4, 56, 108].map((cx) => (
          <circle key={cx} cx={cx} cy="12" r="3" className="fill-line" />
        ))}
      </svg>

      <svg
        className="mx-auto h-20 w-6 md:hidden"
        viewBox="0 0 24 80"
        aria-hidden="true"
      >
        <line
          x1="12"
          y1="4"
          x2="12"
          y2="76"
          className="stroke-line"
          strokeWidth="1"
        />
        {[4, 40, 76].map((cy) => (
          <circle key={cy} cx="12" cy={cy} r="3" className="fill-line" />
        ))}
      </svg>
    </>
  );
}

/* Signed-in users have already picked a side, so they get their own accent and
   nothing else — no pitch, no opposite column, and no bridge to span. */
function RoleBanner({ role }) {
  const isInnovator = role === 'innovator';

  return (
    <section className="border-b border-line">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div
          className={`border-t-2 pt-6 ${
            isInnovator ? 'border-innovator' : 'border-student'
          }`}
        >
          <p
            className={`font-sans text-xs font-semibold uppercase tracking-widest ${
              isInnovator ? 'text-innovator' : 'text-student'
            }`}
          >
            {isInnovator ? 'Innovators' : 'Students'}
          </p>
          <h1 className="mt-3 font-serif text-3xl font-semibold text-ink">
            {isInnovator ? 'Post a project' : 'Browse projects'}
          </h1>
          <p className="mt-2 font-sans text-ink-light">
            {isInnovator
              ? 'Describe what you want built and the stack it needs.'
              : 'Open ideas from innovators looking for builders.'}
          </p>
          {isInnovator && (
            <Link
              to="/dashboard"
              className="mt-6 inline-block rounded bg-innovator px-5 py-2.5 font-sans text-sm font-medium text-white no-underline transition-opacity hover:opacity-90"
            >
              Post a project
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

function Hero() {
  return (
    <section className="border-b border-line">
      <div className="mx-auto grid max-w-5xl items-start gap-4 px-6 py-16 md:grid-cols-[1fr_auto_1fr] md:gap-0 md:py-24">
        {/* Innovator side — brass */}
        <div className="border-t-2 border-innovator pt-6 md:pr-10">
          <p className="font-sans text-xs font-semibold uppercase tracking-widest text-innovator">
            Innovators
          </p>
          <h1 className="mt-4 font-serif text-4xl font-semibold leading-tight text-ink">
            Post your idea.
            <br />
            Find the builders.
          </h1>
          <p className="mt-4 max-w-sm font-sans text-ink-light">
            Describe what you want built and the stack it needs. Students come
            to you.
          </p>
          <Link
            to="/dashboard"
            className="mt-8 inline-block rounded bg-innovator px-5 py-2.5 font-sans text-sm font-medium text-white no-underline transition-opacity hover:opacity-90"
          >
            Post a project
          </Link>
        </div>

        {/* The span between the two sides */}
        <div className="flex justify-center md:self-center md:px-2">
          <Connector />
        </div>

        {/* Student side — teal. Offset down so the two sides read as a pair
            facing each other rather than one centered block. */}
        <div className="border-t-2 border-student pt-6 md:mt-20 md:pl-10 md:text-right">
          <p className="font-sans text-xs font-semibold uppercase tracking-widest text-student">
            Students
          </p>
          <h2 className="mt-4 font-serif text-4xl font-semibold leading-tight text-ink">
            Find a project.
            <br />
            Build something real.
          </h2>
          <p className="mt-4 font-sans text-ink-light md:ml-auto md:max-w-sm">
            Browse open ideas, send a request, and work on something that ships.
          </p>
          <a
            href="#projects"
            className="mt-8 inline-block rounded bg-student px-5 py-2.5 font-sans text-sm font-medium text-white no-underline transition-opacity hover:opacity-90"
          >
            Browse projects
          </a>
        </div>
      </div>
    </section>
  );
}

export function ProjectList() {
  const { data, error, loading } = useApi('/projects');
  const { user, loading: authLoading } = useAuth();

  const projects = data?.projects ?? [];

  return (
    <>
      {/* Nothing until /auth/me resolves — `user` is null while the probe is in
          flight, so rendering early would flash the logged-out pitch at someone
          who is already signed in. The list below doesn't wait on this. */}
      {authLoading ? null : user ? <RoleBanner role={user.role} /> : <Hero />}

      <section id="projects" className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="font-serif text-2xl font-semibold text-ink">Projects</h2>
        <p className="mt-1 font-sans text-ink-light">
          Browse what innovators are building.
        </p>

        {loading && (
          <p className="mt-8 font-sans text-ink-light" data-testid="loading">
            Loading projects…
          </p>
        )}
        {error && (
          <p className="mt-8 font-sans text-[#B3261E]">{error.message}</p>
        )}

        {!loading && !error && projects.length === 0 && (
          <p className="mt-8 font-sans text-ink-light" data-testid="empty">
            No projects yet
          </p>
        )}

        {projects.length > 0 && (
          <ul
            className="mt-8 grid list-none grid-cols-1 gap-px border border-line bg-line p-0 sm:grid-cols-2 lg:grid-cols-3"
            data-testid="project-list"
          >
            {projects.map((project) => (
              <li
                key={project.id}
                className="flex flex-col gap-3 bg-paper p-5"
                data-testid="project-card"
              >
                <h3 className="font-serif text-lg font-semibold">
                  <Link
                    to={`/projects/${project.id}`}
                    className="text-ink no-underline transition-colors hover:text-innovator"
                  >
                    {project.title}
                  </Link>
                </h3>
                <p className="font-sans text-sm text-ink-light">
                  {truncate(project.description)}
                </p>
                <ul className="mt-auto flex list-none flex-wrap gap-2 p-0">
                  {project.tech_stack.map((tech) => (
                    <li
                      key={tech}
                      className="rounded border border-line px-2 py-0.5 font-sans text-xs text-ink-light"
                    >
                      {tech}
                    </li>
                  ))}
                </ul>
                <p className="font-sans text-xs text-ink-light">
                  by{' '}
                  <span className="text-innovator">{project.owner.name}</span>
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
