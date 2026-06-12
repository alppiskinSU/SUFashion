// Step 7 (Feature 17 — Concurrency): parallel 401 responses share one in-flight refresh
// so concurrent API calls do not race and invalidate the refresh token.
const BASE = 'http://localhost:3000';

// Mutex: only one refresh in flight at a time.
// Multiple concurrent 401s all wait on the same promise instead of
// each firing their own refresh request (which would burn the refresh token).
let _refreshPromise = null;

async function refreshAccessToken() {
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    try {
      const refreshToken = sessionStorage.getItem('refreshToken');
      if (!refreshToken) return null;

      const res = await fetch(`${BASE}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!res.ok) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('refreshToken');
        sessionStorage.removeItem('user');
        return null;
      }

      const data = await res.json();
      sessionStorage.setItem('token', data.token);
      if (data.refreshToken) sessionStorage.setItem('refreshToken', data.refreshToken);
      return data.token;
    } finally {
      _refreshPromise = null;
    }
  })();

  return _refreshPromise;
}

export async function authFetch(url, options = {}) {
  const token = sessionStorage.getItem('token');
  const res = await fetch(url, {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${token}` },
  });

  if (res.status !== 401) return res;

  const newToken = await refreshAccessToken();
  if (!newToken) {
    window.location.href = '/login';
    return res;
  }

  return fetch(url, {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${newToken}` },
  });
}
