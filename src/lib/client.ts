import { Client } from 'boardgame.io/react';
import { SocketIO } from 'boardgame.io/multiplayer';
import type { GameState } from '../types';
import { GridSkirmish } from '../game';
import { GridBoard } from '../components/game/GridBoard';

export const resolveServerUrl = () => {
  if (import.meta.env.VITE_SERVER_URL) {
    return import.meta.env.VITE_SERVER_URL as string;
  }
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:8000`;
  }
  return 'http://localhost:8000';
};

export const createClient = (server: string) =>
  Client<GameState>({
    game: GridSkirmish,
    board: GridBoard,
    multiplayer: SocketIO({ server }),
    debug: false
  });