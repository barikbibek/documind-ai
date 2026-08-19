import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { clsx } from 'clsx';
import { BookOpen } from 'lucide-react';
import type { Message } from '../../types';

interface Props {
  message: Message;
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user';

  // Deduplicate sources by sourceFile + pageNumber combination, keep only top 3
  const uniqueSources = useMemo(() => {
    if (!message.sources || message.sources.length === 0) return [];

    const seen = new Set<string>();
    const deduped = message.sources.filter((source) => {
      const key = `${source.sourceFile}:${source.pageNumber ?? 'null'}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Sort by similarity descending and take top 3
    return deduped
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3);
  }, [message.sources]);

  return (
    <div className={clsx('flex gap-2 sm:gap-3', isUser && 'flex-row-reverse')}>
      {/* Avatar */}
      <div className={clsx(
        'w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold',
        isUser ? 'bg-brand-600 text-white' : 'bg-gray-700 text-gray-300'
      )}>
        {isUser ? 'U' : <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
      </div>

      <div className={clsx(
        'flex flex-col gap-2',
        isUser ? 'items-end max-w-[85%] sm:max-w-[70%] md:max-w-[60%]' : 'max-w-[85%] sm:max-w-[75%] md:max-w-[70%]'
      )}>
        {/* Message content */}
        <div className={clsx(
          'rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm leading-relaxed',
          isUser
            ? 'bg-brand-600 text-white rounded-tr-sm'
            : 'bg-gray-800 text-gray-100 rounded-tl-sm'
        )}>
          {isUser ? (
            <p>{message.content}</p>
          ) : (
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                code: ({ children }) => (
                  <code className="bg-gray-900 px-1.5 py-0.5 rounded text-brand-400 text-xs">
                    {children}
                  </code>
                ),
                ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
                strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
              }}
            >
              {message.content || '▋'}
            </ReactMarkdown>
          )}
        </div>

        {/* Source citations — deduplicated & limited to top 3 */}
        {!isUser && uniqueSources.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {uniqueSources.map((source, i) => (
              <div
                key={`${source.sourceFile}-${source.pageNumber}-${i}`}
                className="flex items-center gap-1 bg-gray-900 border border-gray-700 rounded-full px-2 sm:px-2.5 py-0.5 sm:py-1 text-xs text-gray-400"
                title={source.content}
              >
                <BookOpen className="w-3 h-3 text-brand-500 shrink-0" />
                <span className="truncate max-w-[120px] sm:max-w-[160px]">{source.sourceFile}</span>
                {source.pageNumber && <span className="shrink-0">· p.{source.pageNumber}</span>}
                <span className="text-gray-600 shrink-0">
                  {Math.round(source.similarity * 100)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}