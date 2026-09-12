import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';

const labelClass = 'font-sans text-sm font-medium text-ink-light';
const inputClass =
  'mt-1.5 w-full rounded border border-line bg-white px-3 py-2 font-sans text-ink outline-none transition-colors focus:border-ink focus:ring-1 focus:ring-ink';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function update(event) {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login(form);
      // Back to wherever ProtectedRoute intercepted them, else the list.
      navigate(location.state?.from ?? '/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-[400px] px-6 py-16">
      <div className="rounded border border-line bg-paper p-8">
        <h1 className="font-serif text-2xl font-semibold text-ink">Log in</h1>
        <p className="mt-1 font-sans text-sm text-ink-light">
          Welcome back to Project Bridge.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
          <label className="block">
            <span className={labelClass}>Email</span>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={update}
              required
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Password</span>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={update}
              required
              className={inputClass}
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="mt-1 w-full rounded bg-ink px-4 py-2.5 font-sans text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        {error && (
          <p className="mt-4 font-sans text-sm text-[#B3261E]" data-testid="error">
            {error}
          </p>
        )}
      </div>

      <p className="mt-6 text-center font-sans text-sm text-ink-light">
        No account?{' '}
        <Link to="/register" className="text-ink underline">
          Register
        </Link>
      </p>
    </section>
  );
}
