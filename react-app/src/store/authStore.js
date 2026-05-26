import { create } from 'zustand';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('rnsp-user')) || null,
  token: localStorage.getItem('rnsp-token') || null,
  role: localStorage.getItem('rnsp-role') || 'PUBLIC',
  isAuthenticated: !!localStorage.getItem('rnsp-token'),

  setAuth: (user, token) => {
    localStorage.setItem('rnsp-user', JSON.stringify(user));
    localStorage.setItem('rnsp-token', token);
    localStorage.setItem('rnsp-role', user.role);
    set({ user, token, role: user.role, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('rnsp-user');
    localStorage.removeItem('rnsp-token');
    localStorage.removeItem('rnsp-role');
    set({ user: null, token: null, role: 'PUBLIC', isAuthenticated: false });
  },

  refresh: async () => {
    try {
      const response = await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
      const { accessToken } = response.data;
      localStorage.setItem('rnsp-token', accessToken);
      set({ token: accessToken, isAuthenticated: true });
      return accessToken;
    } catch (error) {
      get().logout();
      throw error;
    }
  },
}));

export default useAuthStore;
