import type { GameLogEntry } from '../game/types.ts';
import './GameLog.css';

interface GameLogProps {
  entries: GameLogEntry[];
}

export const GameLog = ({ entries }: GameLogProps) => {
  if (!entries.length) {
    return <p className="log-empty">Command log will appear here.</p>;
  }

  return (
    <div className="log-panel">
      {entries.map((entry) => (
        <div key={entry.id} className="log-entry">
          {entry.message}
        </div>
      ))}
    </div>
  );
};
