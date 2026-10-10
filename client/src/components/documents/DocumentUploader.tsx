import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { documentsApi } from '../../api/documents';
import type { Document } from '../../types';

interface Props {
  sessionId?: string;
  onCreateSession?: () => Promise<string>;
  onUploaded: (docs: Document[], sessionId: string) => void;
}

export function DocumentUploader({ sessionId, onCreateSession, onUploaded }: Props) {
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [createdSessionId, setCreatedSessionId] = useState<string | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    setError('');
    if (files.length + accepted.length > 10) {
      setError('Upload up to 10 PDFs at a time.');
      return;
    }
    setFiles([...files, ...accepted]);
  }, [files]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 10,
    maxSize: 50 * 1024 * 1024,
    disabled: uploading,
    onDropRejected: () => setError('Choose up to 10 PDFs, each 50 MB or smaller.'),
  });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const upload = async () => {
    if (!files.length) return;
    setUploading(true);
    try {
      const id = sessionId ?? createdSessionId ?? await onCreateSession?.();
      if (!id) throw new Error('Could not start a chat. Please try again.');
      if (!sessionId) setCreatedSessionId(id);
      const res = await documentsApi.upload(id, files);
      onUploaded(res.data, id);
      window.dispatchEvent(new Event('usage-updated'));
      setFiles([]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={clsx(
          'border-2 border-dashed rounded-xl px-3 py-4 text-center cursor-pointer transition-colors',
          isDragActive
            ? 'border-brand-500 bg-brand-500/10'
            : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/50'
        )}
      >
        <input {...getInputProps()} />
        <Upload className="w-5 h-5 text-gray-500 mx-auto mb-1" />
        <p className="text-sm text-gray-400">
          {isDragActive ? 'Drop PDFs here' : 'Choose PDFs or drop them here'}
        </p>
        <p className="text-xs text-gray-600 mt-1">Up to 10 PDFs · 50 MB each</p>
      </div>

      {/* Selected files */}
      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
      {files.length > 0 && (
        <div className="flex flex-col gap-2">
          {files.map((file, i) => (
            <div
              key={i}
              className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2"
            >
              <FileText className="w-4 h-4 text-brand-500 shrink-0" />
              <span className="flex-1 text-sm text-gray-300 truncate">{file.name}</span>
              <span className="text-xs text-gray-500">
                {(file.size / 1024 / 1024).toFixed(1)}MB
              </span>
              <button
                onClick={() => removeFile(i)}
                disabled={uploading}
                className="text-gray-500 hover:text-red-400"
                aria-label={`Remove ${file.name}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            onClick={upload}
            disabled={uploading}
            className="w-full py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {uploading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
              : `Upload ${files.length} file${files.length > 1 ? 's' : ''}`
            }
          </button>
        </div>
      )}
    </div>
  );
}
