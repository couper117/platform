import { create } from 'zustand';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export interface AuthUser {
  id: string | number;
  role: string;
  fullName?: string;
  email?: string;
  username?: string;
  [key: string]: unknown;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  role: string;
  isAuthenticated: boolean;
  setAuth: (user: AuthUser, token: string) => void;
  logout: () => void;
  refresh: () => Promise<string>;
}

const useAuthStore = create<AuthState>((set, get) => ({
  user: JSON.parse(localStorage.getItem('rnsp-user') || 'null'),
  token: localStorage.getItem('rnsp-token'),
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

      const meResponse = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const { user } = meResponse.data;
      localStorage.setItem('rnsp-user', JSON.stringify(user));
      localStorage.setItem('rnsp-role', user.role);
      set({ user, role: user.role });

      return accessToken;
    } catch (error) {
      get().logout();
      throw error;
    }
  },
}));

export default useAuthStore;
