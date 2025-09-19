import type { CharacterState, GameState, PlayerID } from '../types.ts';
import { aliveUnits, listUnits } from '../utils.ts';

export const resetTurnFlags = (units: Record<string, CharacterState>, playerID: PlayerID) => {
  Object.values(units)
    .filter((unit) => unit.playerID === playerID && unit.hp > 0)
    .forEach((unit) => {
      unit.hasMoved = false;
      unit.hasActed = false;
    });
};

export const cleanupSelection = (state: GameState) => {
  if (!state.selectedCharacterId) return;
  const selected = state.units[state.selectedCharacterId];
  if (!selected || selected.hp <= 0) {
    state.selectedCharacterId = null;
  }
};

export const checkGameEnd = (state: GameState) => {
  const totalUnits = listUnits(state).length;
  const remaining = {
    '0': aliveUnits(state, '0').length,
    '1': aliveUnits(state, '1').length
  } as Record<PlayerID, number>;

  console.log('endIf check:', {
    player0Units: remaining['0'],
    player1Units: remaining['1'],
    totalUnits,
    units: Object.keys(state.units || {})
  });

  // When the match is first created the client may briefly receive an empty
  // game state before setup finishes hydrating the unit map. In that window the
  // remaining-unit counts are also zero which incorrectly tripped the draw
  // condition and ended the game immediately. Guard against this by requiring
  // that the board actually contains units before checking for a draw.
  if (totalUnits === 0) {
    return undefined;
  }

  if (remaining['0'] === 0 && remaining['1'] === 0) {
    return { draw: true };
  }
  if (remaining['0'] === 0) {
    return { winner: '1' };
  }
  if (remaining['1'] === 0) {
    return { winner: '0' };
  }
  return undefined;
};