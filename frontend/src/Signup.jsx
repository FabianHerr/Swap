import { Link } from 'react-router-dom';
import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Signup = () => {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if(password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setError('');
    axios.post('http://localhost:3001/register', {name, email, password})
    .then (result => {console.log(result)
      if (result.data.success) {
        navigate('/login'); // Redirect to login page on successful registration
      } else {
        alert(result.data.message); // Show error message
      }
    })
    .catch(err => console.error(err));

  }

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card shadow-sm" style={{ width: '400px' }}>
        <div className="card-body">
          <h2 className="card-title text-center mb-4">Sign Up</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="name" className="form-label fw-bold">Name</label>
              <input
                type="text"
                className="form-control"
                id="name"
                name="name"
                placeholder="Enter your name"
                onChange={(e) => setName(e.target.value)} 
              />
            </div>
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
            <div className="mb-3">
              <label htmlFor="confirmPassword" className="form-label fw-bold">Confirm Password</label>
              <input
                type="password"
                className="form-control"
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Confirm your password"
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {error && <small className="text-danger">{error}</small>}
            </div>
            <button type="submit" className="btn btn-primary w-100 mb-3">Sign Up</button>
          </form>
          <div className="text-center">
            <p className="mb-0">Already have an account?</p>
            <Link to='/login'className="btn btn-link">Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
