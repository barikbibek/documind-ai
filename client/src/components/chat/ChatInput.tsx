import { useState } from 'react';
import { Send } from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState('');

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex gap-2 items-end bg-gray-900 border border-gray-700 rounded-2xl p-2 focus-within:border-brand-500 transition-colors">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Ask a question about your documents..."
        rows={1}
        className="flex-1 bg-transparent text-sm text-gray-100 placeholder-gray-500 focus:outline-none resize-none px-2 py-1.5 max-h-32 scrollbar-thin"
        style={{ scrollbarWidth: 'thin' }}
      />
      <button
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        className={clsx(
          'w-9 h-9 rounded-xl flex items-center justify-center transition-colors shrink-0',
          disabled || !value.trim()
            ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
            : 'bg-brand-600 hover:bg-brand-700 text-white'
        )}
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  );
}