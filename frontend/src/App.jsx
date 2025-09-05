import 'bootstrap/dist/css/bootstrap.min.css';
import Signup from './Signup';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './Login';
import OfferPage from './OfferPage';
import Messages from './Messages';
import TopMenu from './TopMenu'; // now a top bar

function App() {
  return (
    <BrowserRouter>
      <div className="d-flex flex-column" style={{ minHeight: "100vh" }}>
        {/* Top bar */}
        <TopMenu />

        {/* Main content area below the top bar */}
        <div
          className="flex-grow-1"
          style={{
            padding: "0px",
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