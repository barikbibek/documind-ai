import { apiClient } from './client';
import type { Session, Document } from '../types';

export const sessionsApi = {
  list: () =>
    apiClient<{ data: Session[] }>('/sessions'),

  create: (title: string) =>
    apiClient<{ data: Session }>('/sessions', { method: 'POST', data: { title } }),

  getOne: (id: string) =>
    apiClient<{ data: Session & { documents: Document[] } }>(`/sessions/${id}`),

  update: (id: string, title: string) =>
    apiClient<{ data: Session }>(`/sessions/${id}`, { method: 'PATCH', data: { title } }),

  delete: (id: string) =>
    apiClient<{ data: unknown }>(`/sessions/${id}`, { method: 'DELETE' }),
};