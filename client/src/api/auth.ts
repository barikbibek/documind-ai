import { apiClient } from './client';
import type { User } from '../types';

interface AuthResponse {
  data: { user: User; token: string };
}

export const authApi = {
  register: (body: { name: string; email: string; password: string }) =>
    apiClient<AuthResponse>('/auth/register', { method: 'POST', data: body }),

  login: (body: { email: string; password: string }) =>
    apiClient<AuthResponse>('/auth/login', { method: 'POST', data: body }),

  me: () =>
    apiClient<{ data: User }>('/auth/me'),
};