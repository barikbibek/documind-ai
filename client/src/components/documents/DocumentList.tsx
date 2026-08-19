import { useEffect, useState, useCallback } from 'react';
import { FileText, Trash2, CheckCircle, AlertCircle, Loader2, Clock } from 'lucide-react';
import { documentsApi } from '../../api/documents';
import type { Document } from '../../types';

interface Props {
  sessionId: string;
  newDocs?: Document[];
}

const statusIcon = {
  pending:    <Clock className="w-4 h-4 text-yellow-500" />,
  processing: <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />,
  ready:      <CheckCircle className="w-4 h-4 text-green-500" />,
  failed:     <AlertCircle className="w-4 h-4 text-red-500" />,
};

export function DocumentList({ sessionId, newDocs }: Props) {
  const [docs, setDocs] = useState<Document[]>([]);

  const fetchDocs = useCallback(async () => {
    try {
      const res = await documentsApi.list(sessionId);
      setDocs(res.data);
    } catch (err) {
      console.error(err);
    }
  }, [sessionId]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  // When new docs are uploaded, add them and start polling
  useEffect(() => {
    if (newDocs?.length) {
      setDocs((prev) => [...newDocs, ...prev]);
    }
  }, [newDocs]);

  // Poll every 3 seconds if any doc is pending/processing
  useEffect(() => {
    const hasPending = docs.some(
      (d) => d.status === 'pending' || d.status === 'processing'
    );
    if (!hasPending) return;

    const interval = setInterval(fetchDocs, 3000);
    return () => clearInterval(interval);
  }, [docs, fetchDocs]);

  const deleteDoc = async (docId: string) => {
    try {
      await documentsApi.delete(sessionId, docId);
      setDocs((prev) => prev.filter((d) => d.id !== docId));
    } catch (err) {
      console.error(err);
    }
  };

  if (docs.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
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
          {statusIcon[doc.status]}
          <button
            onClick={() => deleteDoc(doc.id)}
            className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}