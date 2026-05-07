import { Navigate, useLocation } from 'react-router-dom';

export default function RequireAuth({ children }) {
  const location = useLocation();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  if (!token) {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('postLoginRedirect', location.pathname);
    }
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}
