import { FileStack, Sparkles } from 'lucide-react';

export function Brand({ compact = false }: { compact?: boolean }) {
  return <div className="flex items-center gap-2.5">
    <span className="relative w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-sm">
      <FileStack className="w-5 h-5" strokeWidth={2.1} />
      <Sparkles className="absolute -right-1 -top-1 w-3.5 h-3.5 text-amber-300 fill-gray-900" />
    </span>
    {!compact && <span className="font-bold tracking-tight text-white">DocuMind</span>}
  </div>;
}
