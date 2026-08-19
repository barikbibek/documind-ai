import { useEffect, useRef, useState } from 'react';
import { FileText, Trash2, Upload, ChevronDown, PanelLeft } from 'lucide-react';
import { useSessionStore } from '../store/sessionStore';
import { useChat } from '../hooks/useChat';
import { MessageBubble } from '../components/chat/MessageBubble';
import { ChatInput } from '../components/chat/ChatInput';
import { DocumentUploader } from '../components/documents/DocumentUploader';
import { DocumentList } from '../components/documents/DocumentList';
import { TypingIndicator } from '../components/chat/TypingIndicator';
import type { Document } from '../types';

interface ChatPageProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function ChatPage({ sidebarOpen, onToggleSidebar }: ChatPageProps) {
  const { activeSessionId } = useSessionStore();
  const { messages, isStreaming, sendMessage, clearMessages } = useChat(activeSessionId!);
  const [showUploader, setShowUploader] = useState(false);
  const [newDocs, setNewDocs] = useState<Document[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleUploaded = (docs: Document[]) => {
    setNewDocs(docs);
    setShowUploader(false);
  };

  if (!activeSessionId) return null;

  return (
    <div className="flex flex-col h-screen">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-gray-800 bg-gray-900 gap-2">
        <div className="flex items-center gap-2">
          {/* Sidebar toggle button */}
          {!sidebarOpen && (
            <button
              onClick={onToggleSidebar}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 transition-colors shrink-0"
              title="Open sidebar"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setShowUploader((v) => !v)}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Upload PDFs</span>
            <span className="sm:hidden">PDFs</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showUploader ? 'rotate-180' : ''}`} />
          </button>
        </div>
        <button
          onClick={clearMessages}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-400 transition-colors shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Clear chat</span>
        </button>
      </div>

      {/* Uploader panel */}
      {showUploader && (
        <div className="border-b border-gray-800 bg-gray-900 px-4 md:px-6 py-4 flex flex-col gap-4">
          <DocumentUploader sessionId={activeSessionId} onUploaded={handleUploaded} />
          <DocumentList sessionId={activeSessionId} newDocs={newDocs} />
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col gap-4 sm:gap-6 scrollbar-thin">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12 sm:py-20">
            <div className="w-14 h-14 bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
              <FileText className="w-7 h-7 text-brand-500" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">
              Chat with your documents
            </h2>
            <p className="text-sm text-gray-500 max-w-sm px-4">
              Upload PDFs using the button above, wait for them to be processed, then ask anything.
            </p>
          </div>
        )}

        {messages.map((msg, i) => {
          if (isStreaming && i === messages.length - 1 && msg.role === 'assistant' && msg.content === '') {
            return <TypingIndicator key={i} />;
          }
          return <MessageBubble key={i} message={msg} />;
        })}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 sm:px-6 py-3 sm:py-4 border-t border-gray-800 bg-gray-950">
        <div className="max-w-3xl mx-auto">
          <ChatInput onSend={sendMessage} disabled={isStreaming} />
          <p className="text-xs text-gray-600 text-center mt-2">
            Answers are based only on your uploaded documents
          </p>
        </div>
      </div>
    </div>
  );
}