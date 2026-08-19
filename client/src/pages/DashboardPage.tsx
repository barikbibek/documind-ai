import { useEffect, useState } from 'react';
import { MessageSquare, PanelLeft } from 'lucide-react';
import { useSessionStore } from '../store/sessionStore';
import { sessionsApi } from '../api/sessions';
import { Sidebar } from '../components/layout/Sidebar';
import { ChatPage } from './ChatPage';

export function DashboardPage() {
  const { activeSessionId, setSessions } = useSessionStore();
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768);

  const toggleSidebar = () => setSidebarOpen((v) => !v);

  useEffect(() => {
    sessionsApi.list().then((res) => setSessions(res.data));
  }, []);

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      <main className="flex-1 overflow-hidden relative">
        {activeSessionId ? (
          <ChatPage sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            {/* Toggle button when sidebar is hidden and no active session */}
            {!sidebarOpen && (
              <button
                onClick={toggleSidebar}
                className="absolute top-4 left-4 w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                title="Open sidebar"
              >
                <PanelLeft className="w-5 h-5" />
              </button>
            )}
            <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-brand-500" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Welcome to DocuMind
            </h2>
            <p className="text-gray-500 text-sm max-w-xs">
              Create a new chat from the sidebar, upload your PDFs, and start talking with your documents.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}