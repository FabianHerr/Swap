import { Link, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { PiWarningCircleBold } from "react-icons/pi";
import { useAuth } from './AuthContext';
import { AuthIntro } from './ui';
import logo from './assets/logo.svg';

const Signup = () => {
  const { user, register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Registering logs you in, so this also handles "just signed up"
  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await register(name, email, password);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't create the account. Try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth-panel">
        <AuthIntro logo={logo} />
      </div>
      <div className="auth-form-side">
        <section className="panel auth-card" aria-labelledby="signup-title">
          <h1 className="auth-title" id="signup-title">Create an account</h1>
          <p className="auth-sub">Your name shows on your offers. Your email stays private until you accept a swap.</p>
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="name" className="label">Name</label>
              <input
                type="text"
                className="input"
                id="name"
                name="name"
                autoComplete="given-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="email" className="label">Email</label>
              <input
                type="email"
                className="input"
                id="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="password" className="label">Password</label>
              <input
                type="password"
                className="input"
                id="password"
                name="password"
                autoComplete="new-password"
                aria-describedby="password-hint"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span className="hint" id="password-hint">At least 8 characters</span>
            </div>
            <div className="field">
              <label htmlFor="confirmPassword" className="label">Confirm password</label>
              <input
                type="password"
                className="input"
                id="confirmPassword"
                name="confirmPassword"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <p className="field-error" role="alert">
                <PiWarningCircleBold aria-hidden="true" /> {error}
              </p>
            )}
            <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={submitting}>
              {submitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>
          <p className="auth-switch">
            Already on Swap? <Link to='/login'>Log in</Link>
          </p>
        </section>
      </div>
    </div>
  );
};

export default Signup;
