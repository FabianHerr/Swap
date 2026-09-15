import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { MotionConfig, motion } from 'motion/react';
import Signup from './Signup';
import Login from './Login';
import OfferPage from './pages/OfferPage';
import BrowsePage from './pages/BrowsePage';
import RequestsPage from './pages/RequestsPage';
import TopMenu from './TopMenu';
import RequireAuth from './RequireAuth';
import { ease } from './motion';

const AUTH_ROUTES = ['/login', '/register'];

// Each page fades in when you arrive. Opacity only: pages are visited often.
function Pages() {
  const location = useLocation();
  const isAuthRoute = AUTH_ROUTES.includes(location.pathname);
  return (
    <motion.div
      key={location.pathname}
      className={isAuthRoute ? '' : 'page'}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: ease.out }}
    >
      <Routes location={location}>
        <Route path="/" element={<Navigate to="/offers" replace />} />
        <Route path="/register" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/offers" element={<RequireAuth><BrowsePage /></RequireAuth>} />
        <Route path="/offer" element={<RequireAuth><OfferPage /></RequireAuth>} />
        <Route path="/requests" element={<RequireAuth><RequestsPage /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </motion.div>
  );
}

// Log in and Sign up are a full-bleed split screen with no sidebar; every other page gets the sidebar shell.
function Shell() {
  const location = useLocation();
  const isAuthRoute = AUTH_ROUTES.includes(location.pathname);

  if (isAuthRoute) {
    return (
      <main id="main">
        <Pages />
      </main>
    );
  }

  return (
    <>
      <TopMenu />
      <div className="content-area">
        <main id="main" className="main">
          <Pages />
        </main>
      </div>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      {/* People who ask for less motion get fades instead of movement, everywhere */}
      <MotionConfig reducedMotion="user">
        <div className="app">
          <a className="skip-link" href="#main">Skip to content</a>
          <Shell />
        </div>
      </MotionConfig>
    </BrowserRouter>
  );
}

export default App;
