import type { CharacterClass, CharacterState, PlayerID, Point } from './types.ts';

interface ClassDefinition {
  label: string;
  hp: number;
  moveRange: number;
  attackRange: number;
  damage: number;
  description: string;
}

export const CLASS_DEFINITIONS: Record<CharacterClass, ClassDefinition> = {
  warrior: {
    label: 'Vanguard',
    hp: 12,
    moveRange: 3,
    attackRange: 1,
    damage: 4,
    description: 'Heavy frontline fighter. Deals massive damage to adjacent enemies.'
  },
  archer: {
    label: 'Skyhunter',
    hp: 9,
    moveRange: 3,
    attackRange: 4,
    damage: 3,
    description: 'Ranged specialist. Can strike from long distance after repositioning.'
  },
  mage: {
    label: 'Stormcaller',
    hp: 8,
    moveRange: 2,
    attackRange: 3,
    damage: 2,
    description: 'Area denial caster. Hits a target tile and splashes adjacent foes.'
  }
};

export const INITIAL_FORMATIONS: Record<PlayerID, Array<{ class: CharacterClass; position: Point }>> = {
  '0': [
    { class: 'warrior', position: { x: 1, y: 5 } },
    { class: 'archer', position: { x: 0, y: 3 } },
    { class: 'mage', position: { x: 2, y: 1 } }
  ],
  '1': [
    { class: 'warrior', position: { x: 6, y: 2 } },
    { class: 'archer', position: { x: 7, y: 4 } },
    { class: 'mage', position: { x: 5, y: 6 } }
  ]
};

let unitIdCounter = 0;

export const createUnit = (playerID: PlayerID, charClass: CharacterClass, position: Point): CharacterState => {
  const classData = CLASS_DEFINITIONS[charClass];
  return {
    id: `${playerID}-${charClass}-${unitIdCounter++}`,
    name: classData.label,
    class: charClass,
    playerID,
    hp: classData.hp,
    maxHp: classData.hp,
    moveRange: classData.moveRange,
    attackRange: classData.attackRange,
    damage: classData.damage,
    position: { ...position },
    hasMoved: false,
    hasActed: false
  };
};
