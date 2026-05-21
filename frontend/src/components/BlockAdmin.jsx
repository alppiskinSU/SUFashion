import { Navigate } from 'react-router-dom';

/**
 * Wraps customer-facing routes. If an admin is logged in, redirects to
 * /admin so admins never see the customer storefront.
 */
export default function BlockAdmin({ children }) {
  if (typeof window === 'undefined') return children;
  const raw = sessionStorage.getItem('user');
  if (!raw) return children; // not logged in → customer browsing is fine
  try {
    const user = JSON.parse(raw);
    if (user?.role === 'admin') {
      return <Navigate to="/admin" replace />;
    }
  } catch {
    /* ignore malformed user payload */
  }
  return children;
}
