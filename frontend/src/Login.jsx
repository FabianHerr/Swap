import React from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function Login() {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [error, setError] = React.useState('');
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        axios.post('http://localhost:3001/login', { email, password })
            .then(result => {
                console.log(result);
                console.log('Response data:', result.data);
                if (result.data.success) {
                    navigate('/'); // Redirect to home page on successful login
                } else {
                    setError(result.data.message); // Show error message
                }
            })
            .catch(err => console.error(err));
    };

    return (
        <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
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
                                placeholder="Enter your email"
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="password" className="form-label fw-bold">Password</label>
                            <input
                                type="password"
                                className="form-control"
                                id="password"
                                name="password"
                                placeholder="Enter your password"
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        {error && <div className="text-danger mb-3">{error}</div>}
                        <button type="submit" className="btn btn-primary w-100 mb-3">Login</button>
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