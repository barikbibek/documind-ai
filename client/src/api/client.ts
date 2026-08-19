import { useAuthStore } from '../store/authStore';

interface FetchOptions extends RequestInit {
  data?: unknown;
}

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

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

  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Request failed');
  return json;
}