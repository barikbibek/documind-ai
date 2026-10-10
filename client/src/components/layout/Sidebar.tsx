import { useCallback, useEffect, useState } from 'react';
import { clsx } from 'clsx';
import {
  Plus, Trash2, LogOut, Sun, Moon,
  MessageSquare, PanelLeftClose, ChartNoAxesColumn, X
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useSessionStore } from '../../store/sessionStore';
import { useAuth } from '../../hooks/useAuth';
import { sessionsApi } from '../../api/sessions';
import type { Session } from '../../types';
import { Brand } from '../ui/Brand';
import type { Theme } from '../../hooks/useTheme';
import { usageApi, type Usage } from '../../api/usage';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  theme: Theme;
  onToggleTheme: () => void;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  onDeletedActiveChat: () => void;
}

export function Sidebar({ isOpen, onToggle, theme, onToggleTheme, onNewChat, onSelectSession, onDeletedActiveChat }: SidebarProps) {
  const { user } = useAuthStore();
  const { sessions, activeSessionId, removeSession } = useSessionStore();
  const { logout } = useAuth();
  const [actionError, setActionError] = useState('');
  const [usage, setUsage] = useState<Usage | null>(null);
  const [usageError, setUsageError] = useState(false);
  const [usageOpen, setUsageOpen] = useState(false);

  const refreshUsage = useCallback(() => {
    usageApi.get()
      .then(result => { setUsage(result.data); setUsageError(false); })
      .catch(() => setUsageError(true));
  }, []);

  useEffect(() => {
    refreshUsage();
    window.addEventListener('usage-updated', refreshUsage);
    return () => window.removeEventListener('usage-updated', refreshUsage);
  }, [refreshUsage]);

  const startNewChat = () => {
    setActionError('');
    setUsageOpen(false);
    onNewChat();
    if (window.innerWidth < 768) onToggle();
  };

  const deleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Delete this chat and its PDFs?')) return;
    setActionError('');
    try {
      await sessionsApi.delete(id);
      removeSession(id);
      if (activeSessionId === id) onDeletedActiveChat();
    } catch (err) {
      setActionError((err as Error).message);
    }
  };

  const handleSessionClick = (id: string) => {
    onSelectSession(id);
    setUsageOpen(false);
    // Auto-close sidebar on mobile after selecting a session
    if (window.innerWidth < 768) {
      onToggle();
    }
  };

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        aria-hidden={!isOpen}
        inert={!isOpen}
        className={clsx(
          'h-[100dvh] bg-gray-900 border-r border-gray-800 flex flex-col z-50 transition-all duration-300 ease-in-out shrink-0',
          // Mobile: fixed overlay
          'fixed md:relative',
          isOpen
            ? 'w-64 translate-x-0'
            : 'w-64 -translate-x-full md:w-0 md:translate-x-0 md:border-r-0'
        )}
      >
        <div className={clsx(
          'flex flex-col h-full overflow-hidden',
          isOpen ? 'opacity-100' : 'opacity-0 md:opacity-0'
        )}>
          {/* Header */}
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <Brand />
              <button
                onClick={onToggle}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>
            <button onClick={startNewChat} className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700">
              <Plus className="w-4 h-4" />
              New Chat
            </button>
          </div>

          {/* Sessions list */}
          <nav className="flex-1 overflow-y-auto p-2 scrollbar-thin">
            {actionError && <p role="alert" className="px-3 py-2 text-xs text-red-400">{actionError}</p>}
            {sessions.length === 0 && (
              <div className="text-center py-8 px-3 text-gray-600 text-sm">
                Your chats will appear here after you upload a PDF.
              </div>
            )}
            {sessions.map((session: Session) => (
              <div
                key={session.id}
                className={clsx(
                  'group flex items-center gap-1 rounded-lg transition-colors mb-1',
                  activeSessionId === session.id
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                )}
              >
                <button onClick={() => handleSessionClick(session.id)} className="flex items-center gap-2 flex-1 min-w-0 px-3 py-2 text-left rounded-lg" aria-current={activeSessionId === session.id ? 'page' : undefined}>
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  <span className="flex-1 text-sm truncate">{session.title}</span>
                </button>
                <button
                  onClick={(e) => deleteSession(e, session.id)}
                  className="p-2 mr-1 text-gray-500 hover:text-red-400 opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 transition-opacity"
                  aria-label={`Delete ${session.title}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </nav>

          {/* User footer */}
          <div className="px-3 py-2 border-t border-gray-800 space-y-1">
            {usageOpen && <section role="dialog" aria-label="Usage details" className="mb-2 rounded-xl border border-gray-700 bg-gray-950 p-3 shadow-lg text-xs text-gray-400">
              <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold text-white">Today's usage</h3><button onClick={() => setUsageOpen(false)} aria-label="Close usage details" className="rounded p-1 hover:bg-gray-800"><X className="h-4 w-4" /></button></div>
              {usage ? <div className="space-y-3">
                <div><div className="flex justify-between gap-2"><span>Questions</span><strong className="text-gray-300">{usage.questions.used} / {usage.questions.limit}</strong></div><div className="mt-1 h-1.5 rounded-full bg-gray-800"><div className="h-full rounded-full bg-brand-600" style={{ width: `${Math.min(100, usage.questions.used / usage.questions.limit * 100)}%` }} /></div></div>
                <div><div className="flex justify-between gap-2"><span>PDF uploads</span><strong className="text-gray-300">{usage.uploads.used} / {usage.uploads.limit}</strong></div><div className="mt-1 h-1.5 rounded-full bg-brand-600/20"><div className="h-full rounded-full bg-brand-600" style={{ width: `${Math.min(100, usage.uploads.used / usage.uploads.limit * 100)}%` }} /></div></div>
                <p className="border-t border-gray-800 pt-2">Resets {new Date(usage.resetsAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</p>
              </div> : <p>{usageError ? 'Usage unavailable.' : 'Loading usage…'} <button onClick={refreshUsage} className="text-brand-500 hover:underline">Retry</button></p>}
            </section>}
            <button onClick={() => { setUsageOpen(open => !open); if (!usageOpen) refreshUsage(); }} aria-expanded={usageOpen} aria-label="Usage details" className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-white">
              <ChartNoAxesColumn className="w-4 h-4" /> Usage
            </button>
            <button onClick={onToggleTheme} className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-white" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </button>
          </div>
          <div className="p-4 border-t border-gray-800 flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-700 rounded-full flex items-center justify-center text-xs font-bold text-white">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
            <button onClick={logout} className="text-gray-500 hover:text-red-400 transition-colors" aria-label="Sign out" title="Sign out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
