import { Ctx } from 'boardgame.io';
import type { GameG, PlayerID } from '../types.ts';
import { CLASS_DEFINITIONS } from '../constants.ts';
import { getAttackableTiles, getUnitAtPosition, getReachableTiles, pushLog } from '../utils.ts';

const DAMAGE_SPLASH_OFFSETS = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 }
];


export const selectCharacter = ({ G, ctx  }: {G: GameG, ctx: Ctx}, unitId: string) =>  {

  if (!G.units) {
    console.log('❌ No units in G, returning early');
    return;
  }

  const playerID = ctx.currentPlayer as PlayerID;
  const unit = G.units[unitId];

  console.log('🔍 Unit lookup:', {
    unitId,
    unitFound: !!unit,
    unit: unit
  });

  if (!unit || unit.playerID !== playerID || unit.hp <= 0) {
    console.log('❌ Unit selection failed:', {
      unitExists: !!unit,
      playerMatch: unit?.playerID === playerID,
      unitAlive: unit?.hp > 0
    });
    return;
  }

  G.selectedCharacterId = unitId;
  console.log('✅ Unit selected successfully:', unitId);
};

export const moveCharacter = (G: GameG, ctx: Ctx, destination: { x: number; y: number }) => {
  if (!G.units) return;
  const playerID = ctx.currentPlayer as PlayerID;
  const selected = G.selectedCharacterId ? G.units[G.selectedCharacterId] : undefined;
  if (!selected || selected.playerID !== playerID || selected.hasMoved || selected.hp <= 0) return;
  const reachable = getReachableTiles(selected, G).some((tile) => tile.x === destination.x && tile.y === destination.y);
  if (!reachable) return;
  selected.position = { ...destination };
  selected.hasMoved = true;
  pushLog(G, `${selected.name} repositions to (${destination.x + 1}, ${destination.y + 1}).`);
};

export const attack = (G: GameG, ctx: Ctx, payload: { targetId?: string; targetPosition: { x: number; y: number } }) => {
  if (!G.units) return;
  const playerID = ctx.currentPlayer as PlayerID;
  const selected = G.selectedCharacterId ? G.units[G.selectedCharacterId] : undefined;
  if (!selected || selected.playerID !== playerID || selected.hasActed || selected.hp <= 0) return;
  const attackable = getAttackableTiles(selected).some(
    (tile) => tile.x === payload.targetPosition.x && tile.y === payload.targetPosition.y
  );
  if (!attackable) return;

  const target = payload.targetId ? G.units[payload.targetId] : getUnitAtPosition(G, payload.targetPosition);
  if (!target || target.hp <= 0 || target.playerID === playerID) return;

  const classConfig = CLASS_DEFINITIONS[selected.class];
  target.hp = Math.max(0, target.hp - classConfig.damage);
  selected.hasActed = true;
  pushLog(G, `${selected.name} strikes ${target.name} for ${classConfig.damage} damage.`);

  if (selected.class === 'mage') {
    DAMAGE_SPLASH_OFFSETS.forEach((offset) => {
      const splashPos = { x: payload.targetPosition.x + offset.x, y: payload.targetPosition.y + offset.y };
      const splashTarget = getUnitAtPosition(G, splashPos);
      if (splashTarget && splashTarget.playerID !== playerID) {
        splashTarget.hp = Math.max(0, splashTarget.hp - 1);
        pushLog(G, `${selected.name}'s storm arcs to ${splashTarget.name} (1 splash damage).`);
      }
    });
  }

  if (target.hp <= 0) {
    pushLog(G, `${target.name} has fallen!`);
    if (G.selectedCharacterId === target.id) {
      G.selectedCharacterId = null;
    }
  }
};

export const endTurn = (G: GameG, ctx: Ctx) => {
  if (ctx.events?.endTurn) {
    ctx.events.endTurn();
  }
};
