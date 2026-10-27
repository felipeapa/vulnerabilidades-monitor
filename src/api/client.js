// Browser API client for the vulnerabilities backend.
// In dev, Vite proxies /api to http://localhost:3000 (see vite.config.js).
const BASE_URL = import.meta.env.VITE_API_URL || '';

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error || `Request failed with status ${response.status}`);
  }

  return payload;
}

export function fetchVulnerabilities() {
  return request('/api/vulnerabilidades');
}

export function fetchTechnologies() {
  return request('/api/tecnologias');
}

export function refreshVulnerabilities({ force = false } = {}) {
  return request('/api/refresh', {
    method: 'POST',
    body: JSON.stringify({ force }),
  });
}

export function checkPackage(packageName, version) {
  return request('/api/check', {
    method: 'POST',
    body: JSON.stringify({ packageName, version: version || undefined }),
  });
}

export function reportUrl({ days = 30, technologies = [], format = 'txt' }) {
  const params = new URLSearchParams({ days: String(days), format });
  if (technologies.length) params.set('technologies', technologies.join(','));
  return `${BASE_URL}/api/report?${params.toString()}`;
}
