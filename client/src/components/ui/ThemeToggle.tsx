import { Moon, Sun } from 'lucide-react';
import type { Theme } from '../../hooks/useTheme';

export function ThemeToggle({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  return <button type="button" onClick={onToggle} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} className="absolute right-5 top-5 w-10 h-10 rounded-xl border border-gray-700 bg-gray-900 text-gray-400 hover:text-white flex items-center justify-center">
    {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
  </button>;
}
