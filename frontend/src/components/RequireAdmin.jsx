import { Navigate, useLocation } from 'react-router-dom';

/**
 * SCRUM-111 — Role-based route protection for admin
 *
 * Wraps the /admin route. Enforces two layers:
 *   1. The user must be logged in (token present in sessionStorage).
 *   2. The stored user profile must have role === 'admin'.
 *
 * If not logged in  → redirects to /login (preserves intended destination).
 * If logged in but not admin → redirects to / (customer homepage).
 */
export default function RequireAdmin({ children }) {
  const location = useLocation();

  // No token at all → send to login, remember where they wanted to go
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null;
  if (!token) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Token present but user is not an admin → kick to customer homepage
  try {
    const raw = sessionStorage.getItem('user');
    const user = raw ? JSON.parse(raw) : null;
    if (!user || user.role !== 'admin') {
      return <Navigate to="/" replace />;
    }
  } catch {
    // Malformed user payload — treat as unauthenticated
    return <Navigate to="/login" replace />;
  }

  return children;
}
