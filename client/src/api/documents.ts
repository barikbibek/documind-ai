import { useAuthStore } from '../store/authStore';
import type { Document } from '../types';
import { apiClient, handleUnauthorized } from './client';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const documentsApi = {
  upload: async (sessionId: string, files: File[]) => {
    const token = useAuthStore.getState().token;
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));

    // Note: no Content-Type header here — browser sets it automatically
    // with the correct multipart boundary for FormData
    const res = await fetch(`${BASE_URL}/sessions/${sessionId}/documents/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      handleUnauthorized(res.status);
      throw new Error(json?.message || `Upload failed (${res.status})`);
    }
    if (!json) throw new Error('The server returned an invalid upload response.');
    return json as { data: Document[] };
  },

  list: (sessionId: string) =>
    apiClient<{ data: Document[] }>(`/sessions/${sessionId}/documents`),

  delete: (sessionId: string, docId: string) =>
    apiClient<{ data: unknown }>(`/sessions/${sessionId}/documents/${docId}`, {
      method: 'DELETE',
    }),
};
