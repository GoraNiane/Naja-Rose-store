import api from './api';
import { User } from '../types';

export interface AuthResponse {
  user: User;
  token: string;
}

export const authService = {
  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
  }): Promise<AuthResponse> {
    const res: any = await api.post('/auth/register', data);
    return res.data;
  },

  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    const res: any = await api.post('/auth/login', data);
    return res.data;
  },

  async adminLogin(password: string): Promise<AuthResponse> {
    try {
      const res: any = await api.post('/auth/admin-login', { password });
      return res.data;
    } catch {
      // Fallback in case old endpoint is cached
      const res: any = await api.post('/auth/login', {
        email: 'admin@najarosestore.sn',
        password,
      });
      return res.data;
    }
  },

  async getMe(): Promise<User> {
    const res: any = await api.get('/auth/me');
    return res.data;
  },
};
