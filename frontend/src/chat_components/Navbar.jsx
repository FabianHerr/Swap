import React from 'react';
import { BiMessageSquareDetail } from 'react-icons/bi';

const Navbar = ({ isMobileOpen, setIsMobileOpen }) => (
  <div className="d-flex align-items-center border-bottom sticky-top bg-white px-3" style={{ height: '64px', zIndex: 10 }}>
    <button className="btn d-md-none border-0 bg-transparent fs-3 text-dark me-2" onClick={() => setIsMobileOpen(!isMobileOpen)}>
      ☰
    </button>
    <div className="d-flex align-items-center">
      <BiMessageSquareDetail size={22} className="me-2 text-dark" />
      <h2 className="fw-bold text-dark m-0">Messages</h2>
    </div>
  </div>
);

export default Navbar;