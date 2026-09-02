import { create } from 'zustand';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export interface AuthUser {
  id: string | number;
  role: string;
  fullName?: string;
  email?: string;
  username?: string;
  /**
   * What this account may do, resolved by the server from its role plus any
   * per-account grants and revocations. Read it through useCan(), never by
   * comparing role names — see hooks/useCan.ts.
   *
   * Optional because a session created before capabilities existed has a stored
   * user without it; syncUser() below repairs that on the next page load.
   */
  capabilities?: string[];
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
  syncUser: () => Promise<void>;
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

    // Move whatever this browser followed onto the account. Someone who follows
    // three clubs and then signs up would otherwise lose them at the moment of
    // signing up — the follows belong to the browser, and the server prefers the
    // account. Fire and forget: failing to merge is not a reason to fail a login.
    axios.post(`${API_URL}/favorites/claim`, {}, {
      headers: {
        Authorization: `Bearer ${token}`,
        ...(localStorage.getItem('rnsp-anon-id') ? { 'X-Anon-Id': localStorage.getItem('rnsp-anon-id') } : {}),
      },
    }).catch(() => { /* they can follow again; a login must not fail over this */ });
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

  /**
   * Re-read the account from the server and replace the stored copy.
   *
   * The user object is cached in localStorage so a reload does not flash a
   * signed-out header, but that cache is a snapshot: a role change, a revoked
   * capability, or a deactivation made after sign-in would otherwise not be
   * noticed until the token expired. Called once on app mount.
   *
   * A failure is deliberately silent. This runs on every load, including
   * offline, and the cached copy is a reasonable thing to carry on with — the
   * server still refuses anything the account may not do. Only an explicit 401
   * signs anyone out, and that is the interceptor's job, not this one's.
   */
  syncUser: async () => {
    const token = get().token;
    if (!token) return;
    try {
      const { data } = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!data?.user) return;
      localStorage.setItem('rnsp-user', JSON.stringify(data.user));
      localStorage.setItem('rnsp-role', data.user.role);
      set({ user: data.user, role: data.user.role });
    } catch {
      /* offline or a stale token — the interceptor handles a real 401. */
    }
  },
}));

export default useAuthStore;
