import type { Game } from 'boardgame.io';
import type { GameState, PlayerID } from './types.ts';
import { setupGame } from './setup/index.ts';
import { selectCharacter, moveCharacter, attack, endTurn } from './moves/index.ts';
import { resetTurnFlags, cleanupSelection, checkGameEnd } from './helpers/index.ts';
import { pushLog } from './utils.ts';

export const GridSkirmish: Game<GameState> = {
  name: 'grid-skirmish',
  minPlayers: 2,
  maxPlayers: 2,
  setup: setupGame,
  turn: {
    onBegin: (state, ctx) => {
      if (!ctx) return;
      const currentPlayer = ctx.currentPlayer as PlayerID;
      resetTurnFlags(state.units, currentPlayer);
      cleanupSelection(state);
      pushLog(state, `Player ${Number(currentPlayer) + 1}'s command phase.`);
    },
    onEnd: (state) => {
      state.selectedCharacterId = null;
    }
  },
  moves: {
    selectCharacter,
    moveCharacter,
    attack,
    endTurn
  },
  endIf: checkGameEnd,
  events: {
    endTurn: true
  }
};