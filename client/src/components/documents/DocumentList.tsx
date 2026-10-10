import { useEffect, useState } from 'react';
import { FileText, Trash2, CheckCircle, AlertCircle, Loader2, Clock } from 'lucide-react';
import { documentsApi } from '../../api/documents';
import type { Document } from '../../types';

interface Props {
  sessionId: string;
}

const statusIcon = {
  pending:    <Clock className="w-4 h-4 text-yellow-500" />,
  processing: <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />,
  ready:      <CheckCircle className="w-4 h-4 text-green-500" />,
  failed:     <AlertCircle className="w-4 h-4 text-red-500" />,
};

export function DocumentList({ sessionId }: Props) {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = () => {
      documentsApi.list(sessionId)
        .then(res => { setDocs(res.data); setError(''); })
        .catch(() => setError('Could not load documents.'))
        .finally(() => setLoading(false));
    };
    load();
    window.addEventListener('documents-updated', load);
    return () => window.removeEventListener('documents-updated', load);
  }, [sessionId]);

  // Poll while processing without exhausting the API's general request limit.
  useEffect(() => {
    const hasPending = docs.some(
      (d) => d.status === 'pending' || d.status === 'processing'
    );
    if (!hasPending) return;

    const interval = setInterval(() => {
      documentsApi.list(sessionId).then(res => setDocs(res.data)).catch(() => setError('Could not refresh document status.'));
    }, 10000);
    return () => clearInterval(interval);
  }, [docs, sessionId]);

  const deleteDoc = async (docId: string) => {
    if (!window.confirm('Delete this PDF from the chat?')) return;
    try {
      await documentsApi.delete(sessionId, docId);
      setDocs((prev) => prev.filter((d) => d.id !== docId));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
      {loading && <p className="text-sm text-gray-500">Loading documents…</p>}
      {!loading && docs.length === 0 && <p className="text-sm text-gray-500">No PDFs in this chat yet. Use the paperclip to attach one.</p>}
      {docs.length > 0 && <>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
        Documents ({docs.length})
      </p>
      {docs.map((doc) => (
        <div
          key={doc.id}
          className="group flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2"
        >
          <FileText className="w-4 h-4 text-brand-500 shrink-0" />
          <span className="flex-1 text-sm text-gray-300 truncate">
            {doc.originalName}
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-500" title={doc.status === 'failed' ? 'Processing failed' : doc.status}>
            {statusIcon[doc.status]}<span className="hidden sm:inline capitalize">{doc.status}</span>
          </span>
          <button
            onClick={() => deleteDoc(doc.id)}
            className="text-gray-500 hover:text-red-400 transition-colors"
            aria-label={`Delete ${doc.originalName}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      </>}
    </div>
  );
}
