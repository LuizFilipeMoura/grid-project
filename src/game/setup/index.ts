import { createUnit, INITIAL_FORMATIONS } from '../constants.ts';
import type { CharacterState, GameState, PlayerID } from '../types.ts';

export const setupGame = (): GameState => {
  const units: Record<string, CharacterState> = {};

  (['0', '1'] as PlayerID[]).forEach((playerID) => {
    INITIAL_FORMATIONS[playerID].forEach(({ class: klass, position }) => {
      const unit = createUnit(playerID, klass, position);
      units[unit.id] = unit;
    });
  });

  console.log('Setup created units:', Object.keys(units));
  console.log('Setup units count:', Object.keys(units).length);

  const gameState = {
    units,
    selectedCharacterId: null,
    log: []
  } satisfies GameState;

  console.log('Final game state units:', Object.keys(gameState.units));
  return gameState;
};