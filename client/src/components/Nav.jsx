import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';

const styles = {
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '0.75rem 1rem',
    borderBottom: '1px solid currentColor',
    marginBottom: '1.5rem',
  },
  spacer: { marginLeft: 'auto' },
};

export function Nav() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return (
    <nav style={styles.nav} data-testid="nav">
      <Link to="/">Projects</Link>

      {/* Hold the role-specific links back until the probe resolves, so we
          never briefly render the logged-out nav for a signed-in user. */}
      {loading ? (
        <span style={styles.spacer}>…</span>
      ) : user ? (
        <>
          {user.role === 'innovator' && <Link to="/dashboard">Dashboard</Link>}
          {user.role === 'student' && <Link to="/my-requests">My Requests</Link>}
          {user.role === 'student' && <Link to="/profile">Profile</Link>}
          <span style={styles.spacer} data-testid="nav-role">
            {user.role}
          </span>
          <button type="button" onClick={handleLogout}>
            Log out
          </button>
        </>
      ) : (
        <>
          <span style={styles.spacer} />
          <Link to="/login">Log in</Link>
          <Link to="/register">Register</Link>
        </>
      )}
    </nav>
  );
}
