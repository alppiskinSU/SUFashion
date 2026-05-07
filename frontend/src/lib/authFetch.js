const BASE = 'http://localhost:3000';

async function refreshAccessToken() {
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
