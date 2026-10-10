import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

function initialTheme(): Theme {
  const saved = localStorage.getItem('documind-theme');
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  useEffect(() => {
    document.documentElement.classList.toggle('theme-light', theme === 'light');
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem('documind-theme', theme);
  }, [theme]);
  return { theme, toggleTheme: () => setTheme(value => value === 'dark' ? 'light' : 'dark') };
}
