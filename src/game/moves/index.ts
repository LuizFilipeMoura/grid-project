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

export const moveCharacter = (
  { G, ctx }: { G: GameG; ctx: Ctx },
  destination: { x: number; y: number }
) => {
  if (!G.units) {
    console.log('❌ Move aborted: unit registry missing.');
    return;
  }

  const playerID = ctx.currentPlayer as PlayerID;
  const selectedId = G.selectedCharacterId;

  if (!selectedId) {
    console.log('❌ Move aborted: no character selected.');
    return;
  }

  const selected = G.units[selectedId];

  console.log('🚶 Attempting move command:', {
    selectedId,
    destination,
    unitExists: Boolean(selected)
  });

  if (!selected) {
    console.log('❌ Move aborted: selected unit not found in roster.', { selectedId });
    return;
  }

  if (selected.playerID !== playerID) {
    console.log('❌ Move aborted: unit belongs to a different commander.', {
      playerID,
      unitOwner: selected.playerID
    });
    return;
  }

  if (selected.hasMoved) {
    console.log('❌ Move aborted: unit has already moved this turn.', { selectedId });
    return;
  }

  if (selected.hp <= 0) {
    console.log('❌ Move aborted: unit is incapacitated.', { selectedId, hp: selected.hp });
    return;
  }

  const reachableTiles = getReachableTiles(selected, G);
  const reachable = reachableTiles.some(
    (tile) => tile.x === destination.x && tile.y === destination.y
  );

  console.log('🔍 Reachable tile check:', {
    selectedId,
    destination,
    reachable,
    reachableCount: reachableTiles.length
  });

  if (!reachable) {
    console.log('❌ Move aborted: destination not within movement range.', {
      destination,
      currentPosition: selected.position
    });
    return;
  }

  selected.position = { ...destination };
  selected.hasMoved = true;
  pushLog(G, `${selected.name} repositions to (${destination.x + 1}, ${destination.y + 1}).`);
  console.log('✅ Move executed successfully.', { unitId: selected.id, destination });
};

export const attack = (
  { G, ctx }: { G: GameG; ctx: Ctx },
  payload: { targetId?: string; targetPosition: { x: number; y: number } }
) => {
  if (!G.units) {
    console.log('❌ Attack aborted: unit registry missing.');
    return;
  }

  const playerID = ctx.currentPlayer as PlayerID;
  const selectedId = G.selectedCharacterId;

  console.log('🎯 Attempting attack command:', {
    selectedId,
    payload,
    hasUnits: Object.keys(G.units).length
  });

  if (!selectedId) {
    console.log('❌ Attack aborted: no character selected.');
    return;
  }

  const selected = G.units[selectedId];

  if (!selected) {
    console.log('❌ Attack aborted: selected unit not found in roster.', { selectedId });
    return;
  }

  if (selected.playerID !== playerID) {
    console.log('❌ Attack aborted: unit belongs to a different commander.', {
      playerID,
      unitOwner: selected.playerID
    });
    return;
  }

  if (selected.hasActed) {
    console.log('❌ Attack aborted: unit has already acted this turn.', { selectedId });
    return;
  }

  if (selected.hp <= 0) {
    console.log('❌ Attack aborted: unit is incapacitated.', { selectedId, hp: selected.hp });
    return;
  }

  const attackableTiles = getAttackableTiles(selected);
  const attackable = attackableTiles.some(
    (tile) => tile.x === payload.targetPosition.x && tile.y === payload.targetPosition.y
  );

  console.log('🔍 Attack range check:', {
    selectedId,
    targetPosition: payload.targetPosition,
    attackable,
    attackableCount: attackableTiles.length
  });

  if (!attackable) {
    console.log('❌ Attack aborted: target position is not attackable.', {
      targetPosition: payload.targetPosition,
      currentPosition: selected.position
    });
    return;
  }

  const target = payload.targetId
    ? G.units[payload.targetId]
    : getUnitAtPosition(G, payload.targetPosition);

  console.log('🎯 Target lookup result:', {
    requestedTargetId: payload.targetId,
    resolvedTargetId: target?.id,
    targetExists: Boolean(target)
  });

  if (!target) {
    console.log('❌ Attack aborted: no valid target at the specified location.', payload);
    return;
  }

  if (target.hp <= 0) {
    console.log('❌ Attack aborted: target is already down.', { targetId: target.id });
    return;
  }

  if (target.playerID === playerID) {
    console.log('❌ Attack aborted: cannot attack an ally.', {
      attackerId: selected.id,
      targetId: target.id
    });
    return;
  }

  const classConfig = CLASS_DEFINITIONS[selected.class];
  const previousHp = target.hp;
  target.hp = Math.max(0, target.hp - classConfig.damage);
  selected.hasActed = true;
  pushLog(G, `${selected.name} strikes ${target.name} for ${classConfig.damage} damage.`);
  console.log('✅ Attack resolved:', {
    attackerId: selected.id,
    targetId: target.id,
    damage: classConfig.damage,
    previousHp,
    remainingHp: target.hp
  });

  if (selected.class === 'mage') {
    console.log("🌩️ Resolving mage's splash damage...");
    DAMAGE_SPLASH_OFFSETS.forEach((offset) => {
      const splashPos = {
        x: payload.targetPosition.x + offset.x,
        y: payload.targetPosition.y + offset.y
      };
      const splashTarget = getUnitAtPosition(G, splashPos);
      console.log('🔄 Checking splash tile:', {
        splashPos,
        splashTargetId: splashTarget?.id,
        splashTargetOwner: splashTarget?.playerID
      });
      if (splashTarget && splashTarget.playerID !== playerID) {
        const splashPreviousHp = splashTarget.hp;
        splashTarget.hp = Math.max(0, splashTarget.hp - 1);
        pushLog(G, `${selected.name}'s storm arcs to ${splashTarget.name} (1 splash damage).`);
        console.log('✅ Splash damage applied:', {
          splashTargetId: splashTarget.id,
          previousHp: splashPreviousHp,
          remainingHp: splashTarget.hp
        });
      }
    });
  }

  if (target.hp <= 0) {
    console.log('💥 Target eliminated:', { targetId: target.id });
    pushLog(G, `${target.name} has fallen!`);
    if (G.selectedCharacterId === target.id) {
      G.selectedCharacterId = null;
      console.log('ℹ️ Cleared selection for defeated unit.', { targetId: target.id });
    }
  }
};

export const endTurn = ({ G, ctx }: { G: GameG; ctx: Ctx }) => {
  console.log('🛎️ Attempting to end turn.', {
    currentPlayer: ctx.currentPlayer,
    selectedCharacter: G.selectedCharacterId
  });

  if (!ctx.events?.endTurn) {
    console.log('❌ End turn aborted: endTurn event not available.');
    return;
  }

  ctx.events.endTurn();
  console.log('✅ Turn ended successfully.', { currentPlayer: ctx.currentPlayer });
};
