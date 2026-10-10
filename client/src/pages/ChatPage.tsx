import { useEffect, useRef, useState } from 'react';
import { FileStack, Trash2, PanelLeft, Files, X } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import { MessageBubble } from '../components/chat/MessageBubble';
import { DocumentComposer } from '../components/chat/DocumentComposer';
import { DocumentList } from '../components/documents/DocumentList';
import { TypingIndicator } from '../components/chat/TypingIndicator';

interface ChatPageProps {
  sessionId: string;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  draft: string;
  onDraftChange: (value: string) => void;
  showDocumentsInitially?: boolean;
}

export function ChatPage({ sessionId, sidebarOpen, onToggleSidebar, draft, onDraftChange, showDocumentsInitially = false }: ChatPageProps) {
  const { messages, isStreaming, loadingHistory, error, sendMessage, clearMessages } = useChat(sessionId);
  const [showDocuments, setShowDocuments] = useState(showDocumentsInitially);
  const scrollRef = useRef<HTMLDivElement>(null);
  const followLatest = useRef(true);

  // Follow new tokens only while the reader is already near the bottom.
  useEffect(() => {
    const scroller = scrollRef.current;
    if (scroller && followLatest.current) scroller.scrollTop = scroller.scrollHeight;
  }, [messages]);

  const handleScroll = () => {
    const scroller = scrollRef.current;
    if (scroller) followLatest.current = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 120;
  };

  const handleClear = () => {
    if (messages.length && window.confirm('Clear all messages in this chat?')) void clearMessages();
  };

  const handleUploaded = () => {
    setShowDocuments(true);
    window.dispatchEvent(new Event('documents-updated'));
  };

  const isWelcome = !loadingHistory && messages.length === 0;

  return (
    <div className="flex flex-col h-[100dvh] min-h-0">
      {/* Top bar */}
      <div className="flex shrink-0 min-h-14 items-center justify-between px-3 sm:px-4 md:px-6 py-2 border-b border-gray-800 bg-gray-900 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* Sidebar toggle button */}
          {!sidebarOpen && (
            <button
              onClick={onToggleSidebar}
              className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 transition-colors shrink-0"
              title="Open sidebar" aria-label="Open sidebar"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          )}
          <span className="text-sm font-medium text-gray-300 truncate">Document chat</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button onClick={() => setShowDocuments(v => !v)} aria-expanded={showDocuments} className="min-w-10 min-h-10 px-2 flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-white" title="View documents" aria-label="View documents">
            <Files className="w-4 h-4" /><span className="hidden sm:inline">Documents</span>
          </button>
          <button onClick={handleClear} disabled={isStreaming || messages.length === 0} className="min-w-10 min-h-10 px-2 flex items-center justify-center gap-1.5 text-xs text-gray-500 hover:text-red-400 transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed" title="Clear chat" aria-label="Clear chat">
            <Trash2 className="w-3.5 h-3.5" /><span className="hidden sm:inline">Clear chat</span>
          </button>
        </div>
      </div>

      {showDocuments && (
        <div className="border-b border-gray-800 bg-gray-900 px-4 md:px-6 py-3 max-h-56 overflow-y-auto">
          <div className="max-w-3xl lg:max-w-4xl 2xl:max-w-5xl mx-auto flex items-center justify-between mb-2"><span className="text-xs font-semibold text-gray-400">Documents in this chat</span><button onClick={() => setShowDocuments(false)} aria-label="Close documents"><X className="w-4 h-4 text-gray-500" /></button></div>
          <div className="max-w-3xl lg:max-w-4xl 2xl:max-w-5xl mx-auto"><DocumentList sessionId={sessionId} /></div>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-6 py-4 sm:py-8 scrollbar-thin">
        <div className="max-w-3xl lg:max-w-4xl 2xl:max-w-5xl w-full min-h-full mx-auto flex flex-col gap-5 sm:gap-7">
        {loadingHistory && <div className="flex-1 flex items-center justify-center text-sm text-gray-500">Loading messages…</div>}
        {isWelcome && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-6 sm:py-12">
            <div className="w-14 h-14 bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
              <FileStack className="w-7 h-7 text-brand-500" />
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-white mb-2">
              Chat with your documents
            </h2>
            <p className="text-sm text-gray-500 max-w-md px-4 mb-6 sm:mb-8">
              Attach a PDF, wait for it to process, then ask anything about it.
            </p>
          </div>
        )}

        {messages.map((msg, i) => {
          if (isStreaming && i === messages.length - 1 && msg.role === 'assistant' && msg.content === '') {
            return <TypingIndicator key={i} />;
          }
          return <MessageBubble key={i} message={msg} />;
        })}

        </div>
      </div>

      {/* Input */}
      <DocumentComposer sessionId={sessionId} value={draft} onChange={onDraftChange} error={error} disabled={isStreaming || loadingHistory} onSend={(question) => { followLatest.current = true; return sendMessage(question); }} onUploaded={handleUploaded} />
    </div>
  );
}
