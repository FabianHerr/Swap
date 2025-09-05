import 'bootstrap/dist/css/bootstrap.min.css';
import Signup from './Signup';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './Login';
import OfferPage from './OfferPage';
import Messages from './Messages';
import SideMenu from './SideMenu'; // import your SideMenu

function App() {
  return (
    <BrowserRouter>
      <div className="d-flex">
        {/* Sidebar: always visible */}
        <SideMenu />

        {/* Main content area */}
        <div
          className="flex-grow-1"
          style={{
            marginLeft: "280px", // adjust if sidebar collapses
            transition: "margin-left 0.3s ease",
            padding: "20px",
          }}
        >
          <Routes>
            <Route path="/register" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/offer" element={<OfferPage />} />
            <Route path="/messages" element={<Messages />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;