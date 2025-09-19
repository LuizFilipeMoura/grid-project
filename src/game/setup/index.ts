import { createUnit, INITIAL_FORMATIONS } from '../constants.ts';
import type { CharacterState, GameState, PlayerID } from '../types.ts';

export const setupGame = (): GameState => {
  console.log('🎮 Starting game setup...');

  const units: Record<string, CharacterState> = {};

  (['0', '1'] as PlayerID[]).forEach((playerID) => {
    console.log(`🔧 Setting up player ${playerID}...`);
    INITIAL_FORMATIONS[playerID].forEach(({ class: klass, position }) => {
      const unit = createUnit(playerID, klass, position);
      console.log(`✅ Created unit: ${unit.id} (${unit.name}) at (${position.x}, ${position.y})`);
      units[unit.id] = unit;
    });
  });

  console.log('🔍 Setup created units:', Object.keys(units));
  console.log('📊 Setup units count:', Object.keys(units).length);
  console.log('🏗️ Full units object:', units);

  const gameState = {
    units,
    selectedCharacterId: null,
    log: []
  } satisfies GameState;

  console.log('🎯 Final game state units:', Object.keys(gameState.units));
  console.log('🎯 Final game state:', gameState);

  return gameState;
};