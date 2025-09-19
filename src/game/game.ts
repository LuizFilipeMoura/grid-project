import type { Game } from 'boardgame.io';
import { Ctx } from 'boardgame.io';
import { createUnit, INITIAL_FORMATIONS, CLASS_DEFINITIONS } from './constants.ts';
import type { CharacterState, GameState, PlayerID } from './types.ts';
import { aliveUnits, getAttackableTiles, getUnitAtPosition, getReachableTiles, pushLog, listUnits } from './utils.ts';

const DAMAGE_SPLASH_OFFSETS = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 }
];

const resetTurnFlags = (units: Record<string, CharacterState>, playerID: PlayerID) => {
  Object.values(units)
    .filter((unit) => unit.playerID === playerID && unit.hp > 0)
    .forEach((unit) => {
      unit.hasMoved = false;
      unit.hasActed = false;
    });
};

const cleanupSelection = (state: GameState) => {
  if (!state.selectedCharacterId) return;
  const selected = state.units[state.selectedCharacterId];
  if (!selected || selected.hp <= 0) {
    state.selectedCharacterId = null;
  }
};

export const GridSkirmish: Game<GameState> = {
  name: 'grid-skirmish',
  minPlayers: 2,
  maxPlayers: 2,
  setup: () => {
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
  },
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
    selectCharacter(state, ctx: Ctx, unitId: string) {
      const playerID = ctx.currentPlayer as PlayerID;
      const unit = state.units[unitId];
      if (!unit || unit.playerID !== playerID || unit.hp <= 0) return;
      state.selectedCharacterId = unitId;
    },
    moveCharacter(state, ctx: Ctx, destination: { x: number; y: number }) {
      const playerID = ctx.currentPlayer as PlayerID;
      const selected = state.selectedCharacterId ? state.units[state.selectedCharacterId] : undefined;
      if (!selected || selected.playerID !== playerID || selected.hasMoved || selected.hp <= 0) return;
      const reachable = getReachableTiles(selected, state).some((tile) => tile.x === destination.x && tile.y === destination.y);
      if (!reachable) return;
      selected.position = { ...destination };
      selected.hasMoved = true;
      pushLog(state, `${selected.name} repositions to (${destination.x + 1}, ${destination.y + 1}).`);
    },
    attack(state, ctx: Ctx, payload: { targetId?: string; targetPosition: { x: number; y: number } }) {
      const playerID = ctx.currentPlayer as PlayerID;
      const selected = state.selectedCharacterId ? state.units[state.selectedCharacterId] : undefined;
      if (!selected || selected.playerID !== playerID || selected.hasActed || selected.hp <= 0) return;
      const attackable = getAttackableTiles(selected).some(
        (tile) => tile.x === payload.targetPosition.x && tile.y === payload.targetPosition.y
      );
      if (!attackable) return;

      const target = payload.targetId ? state.units[payload.targetId] : getUnitAtPosition(state, payload.targetPosition);
      if (!target || target.hp <= 0 || target.playerID === playerID) return;

      const classConfig = CLASS_DEFINITIONS[selected.class];
      target.hp = Math.max(0, target.hp - classConfig.damage);
      selected.hasActed = true;
      pushLog(state, `${selected.name} strikes ${target.name} for ${classConfig.damage} damage.`);

      if (selected.class === 'mage') {
        DAMAGE_SPLASH_OFFSETS.forEach((offset) => {
          const splashPos = { x: payload.targetPosition.x + offset.x, y: payload.targetPosition.y + offset.y };
          const splashTarget = getUnitAtPosition(state, splashPos);
          if (splashTarget && splashTarget.playerID !== playerID) {
            splashTarget.hp = Math.max(0, splashTarget.hp - 1);
            pushLog(state, `${selected.name}'s storm arcs to ${splashTarget.name} (1 splash damage).`);
          }
        });
      }

      if (target.hp <= 0) {
        pushLog(state, `${target.name} has fallen!`);
        if (state.selectedCharacterId === target.id) {
          state.selectedCharacterId = null;
        }
      }
    },
    endTurn(state, ctx: Ctx) {
      if (ctx.events?.endTurn) {
        ctx.events.endTurn();
      }
    }
  },
  endIf: (state) => {
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
  },
  events: {
    endTurn: true
  }
};
