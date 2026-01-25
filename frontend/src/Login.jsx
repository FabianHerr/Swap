import React from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { auth } from './firebase'; 
import { signInWithCustomToken } from "firebase/auth";

function Login() {

    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [error, setError] = React.useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try{
            // 1) Login via JWT Authentification
            const result = await axios.post('http://localhost:3001/auth/login', {email, password});
            if (!result.data.success) {
                setError(result.data.message);
                return;
            }

            // 2) Request firebase token
            const jwt = result.data.token;
            const tokenResponse = await axios.post('http://localhost:3001/chat/firebase-token',{},{headers: {Authorization: `Bearer ${jwt}`}});
            const firebaseToken = tokenResponse.data.firebaseToken;

            // 3) Sign in Firebase
            await signInWithCustomToken(auth, firebaseToken);

            // 4) Redirect after success
            navigate('/');

        } catch(err){
            console.error("Login error:", err);
            setError(err.response?.data?.message || "Login failed");
        }
        
        
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