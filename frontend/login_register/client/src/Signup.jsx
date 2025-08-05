import React from 'react';

const Signup = () => {
  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card shadow-sm" style={{ width: '400px' }}>
        <div className="card-body">
          <h2 className="card-title text-center mb-4">Sign Up</h2>
          <form>
            <div className="mb-3">
              <label htmlFor="name" className="form-label fw-bold">Name</label>
              <input
                type="text"
                className="form-control"
                id="name"
                name="name"
                placeholder="Enter your name"
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
              />
            </div>
            <button type="submit" className="btn btn-primary w-100 mb-3">Sign Up</button>
          </form>
          <div className="text-center">
            <p className="mb-0">Already have an account?</p>
            <button className="btn btn-link">Login</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
