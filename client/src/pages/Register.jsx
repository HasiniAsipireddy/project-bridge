import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';

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
    <section>
      <h1>Register</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Name
          <input name="name" value={form.name} onChange={update} required />
        </label>
        <label>
          Email
          <input name="email" type="email" value={form.email} onChange={update} required />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={update}
            minLength={8}
            required
          />
        </label>
        <label>
          I am a
          <select name="role" value={form.role} onChange={update}>
            <option value="student">Student</option>
            <option value="innovator">Innovator</option>
          </select>
        </label>
        <button type="submit" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      {error && <p data-testid="error">{error}</p>}
    </section>
  );
}
