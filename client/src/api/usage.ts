import { apiClient } from './client';

export interface Usage {
  questions: { used: number; limit: number };
  uploads: { used: number; limit: number };
  resetsAt: string;
}

export const usageApi = {
  get: () => apiClient<{ data: Usage }>('/auth/usage'),
};
