import { useAuthStore } from './store/authStore';

const BASE_URL = 'http://localhost:5000/api';

async function apiRequest(path, options = {}) {
  const { token, logout } = useAuthStore.getState();
  
  const headers = {
    ...options.headers,
  };

  // If we aren't uploading multipart form data (Excel), set JSON content-type
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, config);

  if (response.status === 401 || response.status === 403) {
    const errorData = await response.json().catch(() => ({}));
    // If it's a legitimate token expiration, clear the store and log out
    if (errorData.error === 'Invalid or expired access token' || errorData.error === 'Access token required') {
      logout();
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export const api = {
  get: (path, options) => apiRequest(path, { ...options, method: 'GET' }),
  post: (path, body, options) => apiRequest(path, { ...options, method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) }),
  put: (path, body, options) => apiRequest(path, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  patch: (path, body, options) => apiRequest(path, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path, options) => apiRequest(path, { ...options, method: 'DELETE' }),
};
