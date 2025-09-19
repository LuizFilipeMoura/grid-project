import { Ctx } from 'boardgame.io';
import type { GameState, PlayerID } from '../types.ts';
import { CLASS_DEFINITIONS } from '../constants.ts';
import { getAttackableTiles, getUnitAtPosition, getReachableTiles, pushLog } from '../utils.ts';

const DAMAGE_SPLASH_OFFSETS = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 }
];

export const selectCharacter = (state: GameState, ctx: Ctx, unitId: string) => {
  const playerID = ctx.currentPlayer as PlayerID;
  const unit = state.units[unitId];
  if (!unit || unit.playerID !== playerID || unit.hp <= 0) return;
  state.selectedCharacterId = unitId;
};

export const moveCharacter = (state: GameState, ctx: Ctx, destination: { x: number; y: number }) => {
  const playerID = ctx.currentPlayer as PlayerID;
  const selected = state.selectedCharacterId ? state.units[state.selectedCharacterId] : undefined;
  if (!selected || selected.playerID !== playerID || selected.hasMoved || selected.hp <= 0) return;
  const reachable = getReachableTiles(selected, state).some((tile) => tile.x === destination.x && tile.y === destination.y);
  if (!reachable) return;
  selected.position = { ...destination };
  selected.hasMoved = true;
  pushLog(state, `${selected.name} repositions to (${destination.x + 1}, ${destination.y + 1}).`);
};

export const attack = (state: GameState, ctx: Ctx, payload: { targetId?: string; targetPosition: { x: number; y: number } }) => {
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
};

export const endTurn = (state: GameState, ctx: Ctx) => {
  if (ctx.events?.endTurn) {
    ctx.events.endTurn();
  }
};