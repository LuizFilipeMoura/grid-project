import type { Ctx } from 'boardgame.io';

export const BOARD_SIZE = 8;
export type PlayerID = '0' | '1';
export type CharacterClass = 'warrior' | 'archer' | 'mage';

export interface Point {
  x: number;
  y: number;
}

export interface CharacterState {
  id: string;
  name: string;
  class: CharacterClass;
  playerID: PlayerID;
  hp: number;
  maxHp: number;
  moveRange: number;
  attackRange: number;
  damage: number;
  position: Point;
  hasMoved: boolean;
  hasActed: boolean;
}

export interface GameLogEntry {
  id: string;
  message: string;
}

export interface GameState {
  units: Record<string, CharacterState>;
  selectedCharacterId: string | null;
  log: GameLogEntry[];
}

export type GridCtx = Ctx & { currentPlayer: PlayerID };
