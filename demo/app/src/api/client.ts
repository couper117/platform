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

// STATIC DEMO: this is the self-contained demo app (demo/app). Every request is
// served from the local mock dataset (src/api/demo) — there is no backend and no
// network. Unlike the real system, the adapter is ALWAYS installed here.
//
// Installed synchronously, deferring to the module promise per request. Awaiting
// the import at the top level would make the whole entry graph block on this
// module, so anything the demo dataset imports that also lives in the entry chunk
// would deadlock evaluation and leave the app mounted-but-empty.
const mockAdapterReady = import('./demo/mockAdapter').then((m) => m.default);
apiClient.defaults.adapter = (config) => mockAdapterReady.then((adapter) => adapter(config));

apiClient.interceptors.request.use(
  (config) => {
    const { token } = useAuthStore.getState();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // File uploads must not inherit the instance-wide JSON content type. Axios only
    // auto-negotiates multipart when no Content-Type is set, so leaving the default
    // in place sends the body as application/json — multer then parses no file and
    // the upload silently arrives empty. Clearing it lets the browser set
    // multipart/form-data together with the boundary it generates.
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      if (typeof config.headers?.delete === 'function') {
        config.headers.delete('Content-Type');
      } else {
        delete config.headers['Content-Type'];
      }
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
