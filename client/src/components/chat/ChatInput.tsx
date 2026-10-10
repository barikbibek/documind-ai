import { useEffect, useRef } from 'react';
import { ArrowUp, Paperclip } from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
  onSend: (message: string) => Promise<boolean>;
  disabled?: boolean;
  onAttach: () => void;
  attachmentOpen: boolean;
  value: string;
  onChange: (value: string) => void;
}

export function ChatInput({ onSend, disabled, onAttach, attachmentOpen, value, onChange }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (window.matchMedia('(min-width: 768px)').matches) textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 128)}px`;
  }, [value]);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onChange('');
    void onSend(trimmed).then((accepted) => {
      if (!accepted) onChange(trimmed);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex gap-2 items-end bg-gray-900 border border-gray-700 rounded-2xl p-2 focus-within:border-brand-500 transition-colors">
      <button type="button" onClick={onAttach} aria-label="Attach PDFs" aria-expanded={attachmentOpen} title="Attach PDFs" className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-800 hover:text-white shrink-0">
        <Paperclip className="w-4 h-4" />
      </button>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Ask about your PDFs..."
        rows={1}
        maxLength={2000}
        aria-label="Ask a question about your documents"
        className="flex-1 min-w-0 bg-transparent text-base text-gray-100 placeholder-gray-500 focus:outline-none resize-none px-1 sm:px-2 py-2 max-h-32 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      />
      <button
        onClick={handleSend}
        aria-label="Send message"
        disabled={disabled || !value.trim()}
        className={clsx(
          'w-10 h-10 rounded-xl flex items-center justify-center transition-colors shrink-0',
          disabled || !value.trim()
            ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
            : 'bg-brand-600 hover:bg-brand-700 text-white'
        )}
      >
        <ArrowUp className="w-4 h-4" />
      </button>
    </div>
  );
}
