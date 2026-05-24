import axios from 'axios';
import useAuthStore from '../store/authStore';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Static showcase build: serve every request from a local demo dataset so the
// app runs with no backend. Inert unless built with VITE_DEMO=true — in normal
// builds the branch is dead code and dropped, so this module stays synchronous.
if (import.meta.env.VITE_DEMO === 'true') {
  const { default: mockAdapter } = await import('./demo/mockAdapter');
  apiClient.defaults.adapter = mockAdapter;
}

apiClient.interceptors.request.use(
  (config) => {
    const { token } = useAuthStore.getState();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)