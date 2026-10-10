import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Brand } from '../components/ui/Brand';
import { useTheme } from '../hooks/useTheme';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export function RegisterPage() {
  const { theme, toggleTheme } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register, loading, error } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    register(name, email, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <ThemeToggle theme={theme} onToggle={toggleTheme} />
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Brand />
        </div>

        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <h1 className="text-lg font-semibold text-white mb-1">Create account</h1>
          <p className="text-sm text-gray-400 mb-6">Start chatting with your documents</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Name"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="At least 8 characters"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && (
              <p className="text-sm text-red-400 bg-red-950 border border-red-800 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" loading={loading} className="w-full mt-1">
              Create account
            </Button>
          </form>

          <p className="text-sm text-gray-500 text-center mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-500 hover:text-brand-400">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
