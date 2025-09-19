import { useMemo } from 'react';
import classNames from 'classnames';
import type { BoardProps } from 'boardgame.io/react';
import { CLASS_DEFINITIONS } from '../game/constants.ts';
import type { CharacterState, GameState, PlayerID, Point } from '../game/types.ts';
import { BOARD_SIZE } from '../game/types.ts';
import { getAttackableTiles, getReachableTiles, getUnitAtPosition, listUnits } from '../game/utils.ts';
import { GameLog } from './GameLog.tsx';
import { PlayerPanel } from './PlayerPanel.tsx';
import './GridBoard.css';

const tileKey = (point: Point) => `${point.x},${point.y}`;

export const GridBoard = ({ G, ctx, moves, playerID, isActive, events }: BoardProps<GameState>) => {
  const units = useMemo(() => listUnits(G).sort((a, b) => a.id.localeCompare(b.id)), [G]);
  const selected = G.selectedCharacterId ? G.units[G.selectedCharacterId] : undefined;

  const moveTargets = selected ? getReachableTiles(selected, G) : [];
  const attackTargets = selected ? getAttackableTiles(selected) : [];

  const moveSet = new Set(moveTargets.map(tileKey));
  const attackSet = new Set(attackTargets.map(tileKey));

  const currentPlayer = ctx.currentPlayer as PlayerID;
  const activeLabel = `Player ${Number(currentPlayer) + 1}`;
  const isGameOver = Boolean(ctx.gameover);

  const handleCellClick = (point: Point) => {
    if (!isActive || !playerID || isGameOver) return;
    const occupant = getUnitAtPosition(G, point);
    if (occupant && occupant.playerID === playerID) {
      moves.selectCharacter(occupant.id);
      return;
    }
    if (selected) {
      const key = tileKey(point);
      if (!selected.hasMoved && moveSet.has(key) && !occupant) {
        moves.moveCharacter(point);
        return;
      }
      if (!selected.hasActed && attackSet.has(key) && occupant && occupant.playerID !== playerID) {
        moves.attack({ targetId: occupant.id, targetPosition: point });
      }
    }
  };

  const renderCell = (x: number, y: number) => {
    const occupant = units.find((unit) => unit.hp > 0 && unit.position.x === x && unit.position.y === y);
    const key = tileKey({ x, y });
    const isSelected = occupant?.id === selected?.id;
    return (
      <div
        key={key}
        className={classNames('grid-cell', (x + y) % 2 === 0 ? 'grid-cell--light' : 'grid-cell--dark', {
          'grid-cell--move': moveSet.has(key) && !occupant,
          'grid-cell--attack': attackSet.has(key) && !!occupant && occupant.playerID !== selected?.playerID,
          'grid-cell--selected': isSelected
        })}
        onClick={() => handleCellClick({ x, y })}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleCellClick({ x, y });
          }
        }}
      >
        {occupant && <UnitToken unit={occupant} isSelected={isSelected} />}
      </div>
    );
  };

  const boardRows = [];
  for (let y = 0; y < BOARD_SIZE; y += 1) {
    for (let x = 0; x < BOARD_SIZE; x += 1) {
      boardRows.push(renderCell(x, y));
    }
  }

  const playerUnits: Record<PlayerID, CharacterState[]> = {
    '0': units.filter((unit) => unit.playerID === '0'),
    '1': units.filter((unit) => unit.playerID === '1')
  };

  const endTurnDisabled = !isActive || !playerID || isGameOver || !events?.endTurn;

  return (
    <div className="main-layout">
      <div className="board-shell">
        <div className="board-wrapper">
          <div className="board-perspective">
            <div className="board-grid">
              {boardRows}
              {isGameOver && (
                <div className="gameover-overlay">
                  <h3>{ctx.gameover.winner ? `Victory: Player ${Number(ctx.gameover.winner) + 1}` : 'Draw'}</h3>
                  <span>Refresh to battle again.</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="grid-coordinates">
          {Array.from({ length: BOARD_SIZE }, (_, idx) => (
            <span key={idx}>Col {idx + 1}</span>
          ))}
        </div>
        <div className="turn-banner">
          <div className="turn-banner__status">
            {isGameOver ? 'Engagement complete' : `${activeLabel} is commanding`}
          </div>
          <div className="turn-banner__actions">
            {selected ? (
              <span>
                {CLASS_DEFINITIONS[selected.class].label} ready — Move {selected.hasMoved ? '✓' : '•'} | Act{' '}
                {selected.hasActed ? '✓' : '•'}
              </span>
            ) : (
              <span>Select one of your squad members.</span>
            )}
            <button type="button" onClick={() => moves.endTurn()} disabled={endTurnDisabled}>
              End Turn
            </button>
          </div>
        </div>
      </div>
      <aside className="sidebar-panel">
        <section>
          <h2>Mission Status</h2>
          <PlayerPanel label="Player One" units={playerUnits['0']} isCurrent={currentPlayer === '0'} />
          <PlayerPanel label="Player Two" units={playerUnits['1']} isCurrent={currentPlayer === '1'} />
        </section>
        <section>
          <h2>Command Log</h2>
          <GameLog entries={G.log} />
        </section>
      </aside>
    </div>
  );
};

interface UnitTokenProps {
  unit: CharacterState;
  isSelected: boolean;
}

const UnitToken = ({ unit, isSelected }: UnitTokenProps) => {
  const glyph = unit.class === 'warrior' ? 'W' : unit.class === 'archer' ? 'A' : 'M';
  return (
    <div className={classNames('unit-token', `unit-token--${unit.playerID}`)} aria-label={`${unit.name}, ${unit.class}`}>
      <div className="unit-token__status">
        <span className={classNames('unit-chip', { 'unit-chip--done': unit.hasMoved })}>MV</span>
        <span className={classNames('unit-chip', { 'unit-chip--done': unit.hasActed })}>AT</span>
      </div>
      <span>{glyph}</span>
      <div className="unit-token__hp">{Math.max(unit.hp, 0)} HP</div>
      {isSelected && <span className="sr-only">Selected</span>}
    </div>
  );
};
