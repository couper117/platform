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
// builds the branch is dead code and dropped.
//
// The adapter is installed synchronously and defers to the module promise per
// request. Awaiting the import at the top level instead would make the whole
// entry graph block on this module, so anything the demo dataset imports that
// also lives in the entry chunk would deadlock evaluation and leave the app
// mounted-but-empty.
if (import.meta.env.VITE_DEMO === 'true') {
  const mockAdapterReady = import('./demo/mockAdapter').then((m) => m.default);
  apiClient.defaults.adapter = (config) => mockAdapterReady.then((adapter) => adapter(config));
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
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { refresh } = useAuthStore.getState();
        const newToken = await refresh();
        
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
