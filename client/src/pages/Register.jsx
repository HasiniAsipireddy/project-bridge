import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';

const labelClass = 'font-sans text-sm font-medium text-ink-light';
const inputClass =
  'mt-1.5 w-full rounded border border-line bg-white px-3 py-2 font-sans text-ink outline-none transition-colors focus:border-ink focus:ring-1 focus:ring-ink';

// The brass/teal split starts at signup, so the accent a user sees here is the
// one they keep everywhere else in the app.
const ROLES = [
  {
    value: 'student',
    label: 'Student',
    hint: 'Browse and join projects',
    selected: 'border-student bg-student text-white',
    ring: 'focus-within:ring-student',
  },
  {
    value: 'innovator',
    label: 'Innovator',
    hint: 'Post project ideas',
    selected: 'border-innovator bg-innovator text-white',
    ring: 'focus-within:ring-innovator',
  },
];

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
  });
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
      const user = await register(form);
      navigate(user.role === 'innovator' ? '/dashboard' : '/my-requests', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-[400px] px-6 py-16">
      <div className="rounded border border-line bg-paper p-8">
        <h1 className="font-serif text-2xl font-semibold text-ink">Register</h1>
        <p className="mt-1 font-sans text-sm text-ink-light">
          Create an account to post or join projects.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
          <label className="block">
            <span className={labelClass}>Name</span>
            <input
              name="name"
              value={form.name}
              onChange={update}
              required
              className={inputClass}
            />
          </label>
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
              minLength={8}
              required
              className={inputClass}
            />
          </label>

          <fieldset className="border-0 p-0">
            <legend className={labelClass}>I am a</legend>
            <div className="mt-1.5 grid grid-cols-2 gap-3">
              {ROLES.map((role) => {
                const isSelected = form.role === role.value;
                return (
                  <label
                    key={role.value}
                    className={`cursor-pointer rounded border p-3 text-center transition-colors focus-within:ring-2 ${role.ring} ${
                      isSelected
                        ? role.selected
                        : 'border-line text-ink-light hover:border-ink'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role.value}
                      checked={isSelected}
                      onChange={update}
                      className="sr-only"
                    />
                    <span className="block font-sans text-sm font-medium">
                      {role.label}
                    </span>
                    <span
                      className={`mt-0.5 block font-sans text-xs ${
                        isSelected ? 'text-white/80' : 'text-ink-light'
                      }`}
                    >
                      {role.hint}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 w-full rounded bg-ink px-4 py-2.5 font-sans text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        {error && (
          <p className="mt-4 font-sans text-sm text-[#B3261E]" data-testid="error">
            {error}
          </p>
        )}
      </div>

      <p className="mt-6 text-center font-sans text-sm text-ink-light">
        Already have an account?{' '}
        <Link to="/login" className="text-ink underline">
          Log in
        </Link>
      </p>
    </section>
  );
}
