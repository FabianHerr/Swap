import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

// Wraps pages that need a logged-in user. Everyone else goes to /login and comes back after.
function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

export default RequireAuth;
