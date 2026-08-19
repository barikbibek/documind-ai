import { BookOpen } from 'lucide-react';

export function TypingIndicator() {
  return (
    <div className="flex gap-2 sm:gap-3">
      {/* Avatar — matches the assistant avatar in MessageBubble */}
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 bg-gray-700 text-gray-300">
        <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </div>

      {/* Three-dot typing bubble */}
      <div className="bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
    </div>
  );
}
