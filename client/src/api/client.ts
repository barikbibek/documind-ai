import { useAuthStore } from '../store/authStore';
import { useSessionStore } from '../store/sessionStore';

interface FetchOptions extends RequestInit {
  data?: unknown;
}

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export function handleUnauthorized(status: number) {
  if (status !== 401 || !useAuthStore.getState().token) return;
  useAuthStore.getState().clearAuth();
  useSessionStore.getState().resetSessions();
  window.location.assign('/login');
}

export async function apiClient<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const token = useAuthStore.getState().token;
  const { data, ...rest } = options;

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...(data ? { body: JSON.stringify(data) } : {}),
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    handleUnauthorized(res.status);
    throw new Error(json?.message || `Request failed (${res.status})`);
  }
  if (!json) throw new Error('The server returned an invalid response.');
  return json;
}
