import React from "react";
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

function Login() {

    const { user, login } = useAuth();
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [error, setError] = React.useState('');
    const [submitting, setSubmitting] = React.useState(false);
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
            setError(err.response?.data?.message || "Login failed");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="d-flex justify-content-center align-items-center bg-light" style={{ minHeight: 'calc(100vh - 64px)' }}>
            <div className="card shadow-sm" style={{ width: '400px' }}>
                <div className="card-body">
                    <h2 className="card-title text-center mb-4">Login</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label htmlFor="email" className="form-label fw-bold">Email</label>
                            <input
                                type="email"
                                className="form-control"
                                id="email"
                                name="email"
                                autoComplete="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="password" className="form-label fw-bold">Password</label>
                            <input
                                type="password"
                                className="form-control"
                                id="password"
                                name="password"
                                autoComplete="current-password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        {error && <div className="text-danger mb-3">{error}</div>}
                        <button type="submit" className="btn btn-primary w-100 mb-3" disabled={submitting}>
                            {submitting ? 'Logging in…' : 'Login'}
                        </button>
                    </form>
                    <div className="text-center">
                        <p className="mb-0">Don't have an account?</p>
                        <Link to='/register' className="btn btn-link">Sign Up</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
