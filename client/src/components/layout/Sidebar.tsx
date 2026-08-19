import { useState } from 'react';
import { clsx } from 'clsx';
import {
  BookOpen, Plus, Trash2, LogOut,
  MessageSquare, PanelLeftClose
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useSessionStore } from '../../store/sessionStore';
import { useAuth } from '../../hooks/useAuth';
import { sessionsApi } from '../../api/sessions';
import { Button } from '../ui/Button';
import type { Session } from '../../types';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const { user } = useAuthStore();
  const { sessions, activeSessionId, setActiveSession, addSession, removeSession } = useSessionStore();
  const { logout } = useAuth();
  const [creating, setCreating] = useState(false);

  const createSession = async () => {
    setCreating(true);
    try {
      const res = await sessionsApi.create('New Chat');
      addSession(res.data);
      setActiveSession(res.data.id);
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const deleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await sessionsApi.delete(id);
      removeSession(id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSessionClick = (id: string) => {
    setActiveSession(id);
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
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'h-screen bg-gray-900 border-r border-gray-800 flex flex-col z-50 transition-all duration-300 ease-in-out shrink-0',
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
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-white">DocuMind</span>
              </div>
              <button
                onClick={onToggle}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>
            <Button
              onClick={createSession}
              loading={creating}
              className="w-full"
              size="sm"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </Button>
          </div>

          {/* Sessions list */}
          <nav className="flex-1 overflow-y-auto p-2 scrollbar-thin">
            {sessions.length === 0 && (
              <div className="text-center py-8 text-gray-600 text-sm">
                No chats yet. Create one!
              </div>
            )}
            {sessions.map((session: Session) => (
              <div
                key={session.id}
                onClick={() => handleSessionClick(session.id)}
                className={clsx(
                  'group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors mb-1',
                  activeSessionId === session.id
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                )}
              >
                <MessageSquare className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-sm truncate">{session.title}</span>
                <button
                  onClick={(e) => deleteSession(e, session.id)}
                  className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </nav>

          {/* User footer */}
          <div className="p-4 border-t border-gray-800 flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-700 rounded-full flex items-center justify-center text-xs font-bold text-white">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
            <button onClick={logout} className="text-gray-500 hover:text-red-400 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}