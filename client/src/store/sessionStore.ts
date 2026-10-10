import { create } from 'zustand';
import type { Session } from '../types';

interface SessionState {
  activeSessionId: string | null;
  sessions: Session[];
  setSessions: (sessions: Session[]) => void;
  setActiveSession: (id: string | null) => void;
  resetSessions: () => void;
  addSession: (session: Session) => void;
  removeSession: (id: string) => void;
  updateSessionTitle: (id: string, title: string) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  activeSessionId: null,
  sessions: [],
  setSessions: (sessions) => set({ sessions }),
  setActiveSession: (id) => set({ activeSessionId: id }),
  resetSessions: () => set({ activeSessionId: null, sessions: [] }),
  addSession: (session) =>
    set((state) => ({ sessions: [session, ...state.sessions] })),
  removeSession: (id) =>
    set((state) => {
      const sessions = state.sessions.filter((s) => s.id !== id);
      return {
        sessions,
        activeSessionId: state.activeSessionId === id ? null : state.activeSessionId,
      };
    }),
  updateSessionTitle: (id, title) =>
    set((state) => ({
      sessions: state.sessions.map((s) => (s.id === id ? { ...s, title } : s)),
    })),
}));
