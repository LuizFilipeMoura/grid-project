import type { CharacterState, GameState, PlayerID, Point } from './types.ts';
import { BOARD_SIZE } from './types.ts';

export const manhattanDistance = (a: Point, b: Point) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

export const isWithinBounds = (point: Point): boolean =>
  point.x >= 0 && point.x < BOARD_SIZE && point.y >= 0 && point.y < BOARD_SIZE;

export const listUnits = (state: GameState): CharacterState[] =>
  state.units ? Object.values(state.units) : [];

export const aliveUnits = (state: GameState, playerID?: PlayerID) =>
  listUnits(state).filter((unit) => unit.hp > 0 && (playerID === undefined || unit.playerID === playerID));

export const getUnitAtPosition = (state: GameState, point: Point) =>
  listUnits(state).find((unit) => unit.hp > 0 && unit.position.x === point.x && unit.position.y === point.y);

export const getReachableTiles = (unit: CharacterState, state: GameState): Point[] => {
  if (unit.hasMoved || unit.hp <= 0) return [];
  const tiles: Point[] = [];
  for (let y = 0; y < BOARD_SIZE; y += 1) {
    for (let x = 0; x < BOARD_SIZE; x += 1) {
      const target = { x, y };
      if (manhattanDistance(unit.position, target) > unit.moveRange) continue;
      if (target.x === unit.position.x && target.y === unit.position.y) continue;
      if (getUnitAtPosition(state, target)) continue;
      tiles.push(target);
    }
  }
  return tiles;
};

export const getAttackableTiles = (unit: CharacterState): Point[] => {
  if (unit.hasActed || unit.hp <= 0) return [];
  const tiles: Point[] = [];
  for (let y = 0; y < BOARD_SIZE; y += 1) {
    for (let x = 0; x < BOARD_SIZE; x += 1) {
      const target = { x, y };
      if (manhattanDistance(unit.position, target) === 0) continue;
      if (manhattanDistance(unit.position, target) > unit.attackRange) continue;
      tiles.push(target);
    }
  }
  return tiles;
};

export const formatUnitLabel = (unit: CharacterState) => `${unit.name} (${unit.class})`;

export const pushLog = (state: GameState, message: string) => {
  const entryId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  state.log.unshift({ id: entryId, message });
  if (state.log.length > 30) {
    state.log.length = 30;
  }
};
