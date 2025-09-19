import classNames from 'classnames';
import type { CharacterState } from '../../types';
import { CLASS_DEFINITIONS } from '../../game/constants.ts';
import './PlayerPanel.css';

interface PlayerPanelProps {
  label: string;
  units: CharacterState[];
  isCurrent: boolean;
}

const classGlyph: Record<string, string> = {
  warrior: '⚔️',
  archer: '🏹',
  mage: '✨'
};

export const PlayerPanel = ({ label, units, isCurrent }: PlayerPanelProps) => {
  return (
    <div className={classNames('player-panel', { 'player-panel--current': isCurrent })}>
      <header>
        <h3>{label}</h3>
        {isCurrent && <span className="player-panel__turn">Taking Turn</span>}
      </header>
      <div className="player-panel__units">
        {units.map((unit) => {
          const classData = CLASS_DEFINITIONS[unit.class];
          const hpRatio = unit.hp / unit.maxHp;
          return (
            <div key={unit.id} className={classNames('unit-card', `unit-card--${unit.class}`)}>
              <div className="unit-card__title">
                <span className="unit-card__icon" aria-hidden>
                  {classGlyph[unit.class]}
                </span>
                <div>
                  <strong>{classData.label}</strong>
                  <small>{unit.class.toUpperCase()}</small>
                </div>
              </div>
              <div className="unit-card__stats">
                <div className="hp-bar">
                  <div className="hp-bar__fill" style={{ width: `${Math.max(hpRatio * 100, 0)}%` }} />
                </div>
                <span className="hp-bar__text">
                  HP {Math.max(unit.hp, 0)} / {unit.maxHp}
                </span>
              </div>
              <div className="unit-card__actions">
                <span className={classNames('action-chip', { 'action-chip--done': unit.hasMoved })}>Moved</span>
                <span className={classNames('action-chip', { 'action-chip--done': unit.hasActed })}>Acted</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
