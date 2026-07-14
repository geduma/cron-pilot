import type { ProvidersResponse, LoginResponse, SessionResponse, Provider } from '../types';

const GEDUMA_API_URL = import.meta.env.VITE_GEDUMA_API_URL;
const APP_ID = import.meta.env.VITE_GEDUMA_APP_ID;
const API_URL = import.meta.env.VITE_API_URL;

export const authApi = {
  getProviders: async (): Promise<Provider[]> => {
    try {
      const response = await fetch(`${GEDUMA_API_URL}/auth/providers/${APP_ID}`);
      if (!response.ok || response.status === 204) {
        return [];
      }
      const data: ProvidersResponse = await response.json();
      return data.ok ? (data.data || []) : [];
    } catch {
      return [];
    }
  },

  login: async (providerId: string): Promise<string | null> => {
    try {
      const response = await fetch(`${GEDUMA_API_URL}/auth/login/${APP_ID}/${providerId}`, {
        method: 'POST'
      });
      const data: LoginResponse = await response.json();
      if (data.ok && data.data.redirect) {
        return data.data.redirect;
      }
      return null;
    } catch {
      return null;
    }
  },

  getSession: async (sessionToken: string): Promise<SessionResponse | null> => {
    try {
      const response = await fetch(`${API_URL}/api/auth/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken })
      });
      const data = await response.json();
      if (data.success && data.data) {
        return { ok: true, msg: '', data: data.data };
      }
      return { ok: false, msg: data.message || 'Session validation failed', data: null };
    } catch {
      return null;
    }
  },

  logout: () => {
    localStorage.removeItem('session_token');
    localStorage.removeItem('user');
    window.location.href = '/';
  }
};
