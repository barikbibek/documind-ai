import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useSessionStore } from '../store/sessionStore';
import { sessionsApi } from '../api/sessions';
import { Sidebar } from '../components/layout/Sidebar';
import { ChatPage } from './ChatPage';
import { NewChatPage } from './NewChatPage';

export function DashboardPage() {
  const { activeSessionId, setSessions, setActiveSession } = useSessionStore();
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [draft, setDraft] = useState('');
  const [justUploadedSessionId, setJustUploadedSessionId] = useState<string | null>(null);
  const [newChatKey, setNewChatKey] = useState(0);
  const { theme, toggleTheme } = useTheme();

  const toggleSidebar = () => setSidebarOpen((v) => !v);

  useEffect(() => {
    let cancelled = false;
    sessionsApi.list()
      .then((res) => {
        if (cancelled) return;
        setSessions(res.data);
        setActiveSession(null);
      })
      .catch(() => { if (!cancelled) setLoadError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [setSessions, setActiveSession]);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)');
    const onResize = () => setSidebarOpen(media.matches);
    media.addEventListener('change', onResize);
    return () => media.removeEventListener('change', onResize);
  }, []);

  const startNewChat = () => {
    setDraft('');
    setJustUploadedSessionId(null);
    setActiveSession(null);
    setNewChatKey(key => key + 1);
  };

  const selectChat = (id: string) => {
    setDraft('');
    setJustUploadedSessionId(null);
    setActiveSession(id);
  };

  const finishUpload = (id: string) => {
    setJustUploadedSessionId(id);
    setActiveSession(id);
  };

  return (
    <div className="flex h-[100dvh] min-h-0 bg-gray-950 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} theme={theme} onToggleTheme={toggleTheme} onNewChat={startNewChat} onSelectSession={selectChat} onDeletedActiveChat={startNewChat} />
      <main className="flex-1 min-w-0 min-h-0 overflow-hidden relative">
        {loading ? (
          <div className="h-full flex items-center justify-center text-sm text-gray-500">Loading your chats…</div>
        ) : loadError ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-center p-8">
            <p className="text-sm text-gray-400">Could not load your chats.</p>
            <button onClick={() => window.location.reload()} className="flex items-center gap-2 text-sm text-brand-500 hover:underline"><RefreshCw className="w-4 h-4" /> Retry</button>
          </div>
        ) : activeSessionId ? (
          <ChatPage key={activeSessionId} sessionId={activeSessionId} sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} draft={draft} onDraftChange={setDraft} showDocumentsInitially={justUploadedSessionId === activeSessionId} />
        ) : (
          <NewChatPage key={newChatKey} sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} draft={draft} onDraftChange={setDraft} onSessionCreated={finishUpload} />
        )}
      </main>
    </div>
  );
}
