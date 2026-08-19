export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Session {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  sessionId: string;
  originalName: string;
  fileSize: number;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  pageCount: number | null;
  createdAt: string;
}

export interface Source {
  id: string;
  content: string;
  sourceFile: string;
  pageNumber: number | null;
  similarity: number;
}

export interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  createdAt?: string;
}

export type SSEEvent =
  | { type: 'sources'; data: Source[] }
  | { type: 'token';   data: string }
  | { type: 'done';    data: { fullResponse?: string } }
  | { type: 'error';   data: { message: string } }
  | { type: 'title_update'; data: string };