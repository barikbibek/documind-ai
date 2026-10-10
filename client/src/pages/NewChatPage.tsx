import { useRef, useState } from 'react';
import { FileStack, PanelLeft } from 'lucide-react';
import { sessionsApi } from '../api/sessions';
import { useSessionStore } from '../store/sessionStore';
import { DocumentComposer } from '../components/chat/DocumentComposer';

interface Props {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  draft: string;
  onDraftChange: (value: string) => void;
  onSessionCreated: (sessionId: string) => void;
}

export function NewChatPage({ sidebarOpen, onToggleSidebar, draft, onDraftChange, onSessionCreated }: Props) {
  const addSession = useSessionStore(state => state.addSession);
  const createdId = useRef<string | null>(null);
  const creating = useRef<Promise<string> | null>(null);
  const [error, setError] = useState('');

  const createOnUpload = async () => {
    if (createdId.current) return createdId.current;
    if (!creating.current) {
      creating.current = sessionsApi.create('New Chat').then(res => {
        createdId.current = res.data.id;
        addSession(res.data);
        return res.data.id;
      }).finally(() => { creating.current = null; });
    }
    return creating.current;
  };

  const requestDocument = async (): Promise<boolean> => {
    setError('Attach a PDF first, then ask a question about it.');
    return false;
  };

  return (
    <div className="flex h-[100dvh] min-h-0 flex-col">
      <header className="flex min-h-14 shrink-0 items-center gap-2 border-b border-gray-800 bg-gray-900 px-3 sm:px-4 md:px-6 py-2">
        {!sidebarOpen && <button onClick={onToggleSidebar} title="Open sidebar" aria-label="Open sidebar" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white"><PanelLeft className="h-4 w-4" /></button>}
        <span className="truncate text-sm font-medium text-gray-300">New chat</span>
      </header>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-6 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-800"><FileStack className="h-7 w-7 text-brand-500" /></div>
        <h1 className="mb-2 text-xl sm:text-2xl font-semibold text-white">Chat with your documents</h1>
        <p className="max-w-md text-sm text-gray-500">Attach a PDF, wait for it to process, then ask anything about it.</p>
      </div>
      <DocumentComposer value={draft} onChange={onDraftChange} error={error} onSend={requestDocument} onCreateSession={createOnUpload} onUploaded={(_, sessionId) => onSessionCreated(sessionId)} />
    </div>
  );
}
