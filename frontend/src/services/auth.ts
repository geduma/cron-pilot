import type { ProvidersResponse, LoginResponse, SessionResponse, Provider } from '../types';

const GEDUMA_API_URL = import.meta.env.VITE_GEDUMA_API_URL;
const APP_ID = import.meta.env.VITE_GEDUMA_APP_ID;

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
      const response = await fetch(`${GEDUMA_API_URL}/auth/session/${sessionToken}`);
      const data: SessionResponse = await response.json();
      return data;
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
