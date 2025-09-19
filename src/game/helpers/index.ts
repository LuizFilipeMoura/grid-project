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
  const remaining = {
    '0': aliveUnits(state, '0').length,
    '1': aliveUnits(state, '1').length
  } as Record<PlayerID, number>;

  console.log('endIf check:', {
    player0Units: remaining['0'],
    player1Units: remaining['1'],
    totalUnits: listUnits(state).length,
    units: Object.keys(state.units || {})
  });

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