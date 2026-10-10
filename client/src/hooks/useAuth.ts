import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import { useSessionStore } from '../store/sessionStore';

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setAuth, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await authApi.login({ email, password });
      useSessionStore.getState().resetSessions();
      setAuth(res.data.user, res.data.token);
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await authApi.register({ name, email, password });
      useSessionStore.getState().resetSessions();
      setAuth(res.data.user, res.data.token);
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    useSessionStore.getState().resetSessions();
    clearAuth();
    navigate('/login');
  };

  return { login, register, logout, loading, error };
}
