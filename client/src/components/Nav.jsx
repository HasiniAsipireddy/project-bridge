import { Link, NavLink, useNavigate } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';

const linkClass = 'text-ink-light transition-colors hover:text-ink';

export function Nav() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return (
    <nav
      className="border-b border-line bg-paper"
      data-testid="nav"
    >
      <div className="mx-auto flex max-w-5xl items-center gap-6 px-6 py-4">
        <Link
          to="/"
          className="font-serif text-lg font-semibold text-ink no-underline"
        >
          Project Bridge
        </Link>

        <div className="ml-auto flex items-center gap-5 text-sm">
          <NavLink to="/" end className={linkClass}>
            Projects
          </NavLink>

          {/* Hold the role-specific links back until the probe resolves, so we
              never briefly render the logged-out nav for a signed-in user. */}
          {loading ? (
            <span className="text-ink-light">…</span>
          ) : user ? (
            <>
              {user.role === 'innovator' && (
                <NavLink to="/dashboard" className={linkClass}>
                  Dashboard
                </NavLink>
              )}
              {user.role === 'student' && (
                <NavLink to="/my-requests" className={linkClass}>
                  My Requests
                </NavLink>
              )}
              {user.role === 'student' && (
                <NavLink to="/profile" className={linkClass}>
                  Profile
                </NavLink>
              )}
              <span
                className={`border-l border-line pl-5 ${
                  user.role === 'innovator' ? 'text-innovator' : 'text-student'
                }`}
                data-testid="nav-role"
              >
                {user.role}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded border border-line bg-transparent px-3 py-1.5 text-ink-light transition-colors hover:border-ink hover:text-ink"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass}>
                Log in
              </NavLink>
              <NavLink
                to="/register"
                className="rounded border border-line px-3 py-1.5 text-ink transition-colors hover:border-ink"
              >
                Register
              </NavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
