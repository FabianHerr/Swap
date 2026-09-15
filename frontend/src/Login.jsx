import { useState } from "react";
import { Link, Navigate, useLocation } from 'react-router-dom';
import { PiWarningCircleBold } from "react-icons/pi";
import { useAuth } from './AuthContext';
import { AuthIntro } from './ui';
import logo from './assets/logo.svg';

function Login() {
    const { user, login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const location = useLocation();

    // Once logged in (or already logged in), go back to the page that asked for login
    if (user) return <Navigate to={location.state?.from || '/'} replace />;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            await login(email, password);
        } catch (err) {
            setError(err.response?.data?.message || "Couldn't log in. Try again.");
            setSubmitting(false);
        }
    };

    return (
        <div className="auth">
            <div className="auth-panel">
                <AuthIntro logo={logo} />
            </div>
            <div className="auth-form-side">
                <section className="panel auth-card" aria-labelledby="login-title">
                    <h1 className="auth-title" id="login-title">Log in</h1>
                    <p className="auth-sub">Welcome back. Log in to see open offers and your requests.</p>
                    <form onSubmit={handleSubmit}>
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
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        {error && (
                            <p className="field-error" role="alert">
                                <PiWarningCircleBold aria-hidden="true" /> {error}
                            </p>
                        )}
                        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={submitting}>
                            {submitting ? 'Logging in…' : 'Log in'}
                        </button>
                    </form>
                    <p className="auth-switch">
                        New to Swap? <Link to='/register'>Create an account</Link>
                    </p>
                </section>
            </div>
        </div>
    );
}

export default Login;
