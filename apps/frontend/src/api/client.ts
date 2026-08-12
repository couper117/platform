import axios from 'axios';
import useAuthStore from '../store/authStore';
import useUiStore from '../store/uiStore';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
    const status = error.response?.status;

    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { refresh } = useAuthStore.getState();
        const newToken = await refresh();

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        useUiStore.getState().pushToast('Your session has expired. Please log in again.');
        return Promise.reject(refreshError);
      }
    }

    // The client-side role check is only a UX hint — the server is the actual
    // gate. If it rejects a request as unauthorized/forbidden, surface why
    // instead of failing silently.
    if (status === 401 || status === 403) {
      const message = error.response?.data?.message || 'You do not have permission to do that.';
      useUiStore.getState().pushToast(message);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
