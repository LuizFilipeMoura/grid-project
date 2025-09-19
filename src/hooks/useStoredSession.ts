import { useState } from 'react';
import type { PlayerID } from '../types';

type StoredSession = {
  matchID: string;
  playerID: PlayerID;
  credentials: string;
};

const STORAGE_KEY = 'grid-skirmish-session';

export const useStoredSession = () => {
  const [session, setSession] = useState<StoredSession | null>(() => {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StoredSession;
    } catch (error) {
      console.warn('Failed to parse stored session', error);
      return null;
    }
  });

  const persist = (value: StoredSession | null) => {
    if (typeof window === 'undefined') return;
    if (value) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    setSession(value);
  };

  return [session, persist] as const;
};