import 'bootstrap/dist/css/bootstrap.min.css';
import Signup from './Signup';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import OfferPage from './pages/OfferPage';
import BrowsePage from './pages/BrowsePage';
import TopMenu from './TopMenu'; // now a top bar
import RequireAuth from './RequireAuth';

function App() {
  return (
    <BrowserRouter>
      <div className="d-flex flex-column" style={{ minHeight: "100vh" }}>
        {/* Top bar */}
        <div className="position-fixed top-0 start-0 end-0 bg-white" style={{ zIndex: 1030, height: "64px" }}>
          <TopMenu />
        </div>

        {/* Main content area below the top bar */}
        <div
          className="flex-grow-1"
          style={{
            padding: "0px",
            marginTop: "64px",
          }}
        >
          <Routes>
            <Route path="/" element={<Navigate to="/offers" replace />} />
            <Route path="/register" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/offers" element={<RequireAuth><BrowsePage /></RequireAuth>} />
            <Route path="/offer" element={<RequireAuth><OfferPage /></RequireAuth>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
