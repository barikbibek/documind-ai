import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { documentsApi } from '../../api/documents';
import type { Document } from '../../types';

interface Props {
  sessionId: string;
  onUploaded: (docs: Document[]) => void;
}

export function DocumentUploader({ sessionId, onUploaded }: Props) {
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const onDrop = useCallback((accepted: File[]) => {
    setFiles((prev) => [...prev, ...accepted]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 10,
  });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const upload = async () => {
    if (!files.length) return;
    setUploading(true);
    try {
      const res = await documentsApi.upload(sessionId, files);
      onUploaded(res.data);
      setFiles([]);
    } catch (err) {
      console.error(err);
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
          'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors',
          isDragActive
            ? 'border-brand-500 bg-brand-500/10'
            : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/50'
        )}
      >
        <input {...getInputProps()} />
        <Upload className="w-8 h-8 text-gray-500 mx-auto mb-2" />
        <p className="text-sm text-gray-400">
          {isDragActive ? 'Drop PDFs here' : 'Drag & drop PDFs or click to browse'}
        </p>
        <p className="text-xs text-gray-600 mt-1">Up to 10 files, 50MB each</p>
      </div>

      {/* Selected files */}
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
                className="text-gray-500 hover:text-red-400"
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