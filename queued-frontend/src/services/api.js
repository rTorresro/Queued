import API_BASE_URL from '../config';

export async function apiFetch(endpoint, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    window.dispatchEvent(new CustomEvent('queued:unauthorized'));
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Request failed');
  return data;
}
