import { useState } from 'react';
import { X } from 'lucide-react';
import { ChatInput } from './ChatInput';
import { DocumentUploader } from '../documents/DocumentUploader';
import type { Document } from '../../types';

interface Props {
  sessionId?: string;
  onCreateSession?: () => Promise<string>;
  onUploaded: (docs: Document[], sessionId: string) => void;
  onSend: (question: string) => Promise<boolean>;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
}

export function DocumentComposer({ sessionId, onCreateSession, onUploaded, onSend, value, onChange, disabled, error }: Props) {
  const [showUploader, setShowUploader] = useState(false);

  return (
    <div className="shrink-0 border-t border-gray-800 bg-gray-950 px-3 sm:px-6 py-3 sm:py-4 [padding-bottom:max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="relative mx-auto w-full max-w-3xl lg:max-w-4xl 2xl:max-w-5xl">
        {error && <p role="alert" className="mb-2 rounded-lg border border-red-800 bg-red-950 px-3 py-2 text-sm text-red-300">{error}</p>}
        {showUploader && (
          <div role="dialog" aria-label="Attach PDFs" className="absolute bottom-full left-0 z-20 mb-2 w-full max-w-sm rounded-2xl border border-gray-700 bg-gray-900 p-3 shadow-xl max-h-[min(19rem,42dvh)] overflow-y-auto">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-white">Attach PDFs</h3>
              <button onClick={() => setShowUploader(false)} aria-label="Close upload" className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-800 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <DocumentUploader sessionId={sessionId} onCreateSession={onCreateSession} onUploaded={(docs, id) => { setShowUploader(false); onUploaded(docs, id); }} />
          </div>
        )}
        <ChatInput value={value} onChange={onChange} onSend={onSend} disabled={disabled} onAttach={() => setShowUploader(open => !open)} attachmentOpen={showUploader} />
        <p className="mt-2 px-2 text-center text-xs text-gray-600">Answers are based only on your uploaded documents</p>
      </div>
    </div>
  );
}
