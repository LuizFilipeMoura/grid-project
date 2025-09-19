import { useState } from 'react';
import type { PlayerID } from '../../types';

interface MatchLobbyProps {
  matchID: string;
  // eslint-disable-next-line no-unused-vars
  setMatchID: (id: string) => void;
  playerID: PlayerID;
  // eslint-disable-next-line no-unused-vars
  setPlayerID: (id: PlayerID) => void;
  statusMessage: string;
  isLoading: boolean;
  onCreateMatch: () => void;
  onJoinMatch: () => void;
  onLeaveMatch: () => void;
  credentials: string | null;
}

export const MatchLobby = ({
  matchID,
  setMatchID,
  playerID,
  setPlayerID,
  statusMessage,
  isLoading,
  onCreateMatch,
  onJoinMatch,
  onLeaveMatch,
  credentials
}: MatchLobbyProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopyMatchID = async () => {
    if (!matchID) return;
    try {
      await navigator.clipboard.writeText(matchID);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="p-6 bg-gray-800 rounded-lg mb-6">
      <h2 className="text-xl font-bold mb-4 text-center">Grid Skirmish</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Match ID</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={matchID}
                onChange={(e) => setMatchID(e.target.value)}
                placeholder="Enter match ID"
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              {matchID && (
                <button
                  onClick={handleCopyMatchID}
                  className="px-3 py-2 bg-gray-600 hover:bg-gray-500 rounded transition-colors"
                  disabled={isLoading}
                >
                  {copied ? '✓' : '📋'}
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Player Slot</label>
            <select
              value={playerID}
              onChange={(e) => setPlayerID(e.target.value as PlayerID)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading || !!credentials}
            >
              <option value="0">Player 1</option>
              <option value="1">Player 2</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onCreateMatch}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded font-medium transition-colors"
            >
              {isLoading ? 'Creating...' : 'Create Match'}
            </button>

            <button
              onClick={onJoinMatch}
              disabled={isLoading || !matchID}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded font-medium transition-colors"
            >
              {isLoading ? 'Joining...' : 'Join Match'}
            </button>
          </div>

          {credentials && (
            <button
              onClick={onLeaveMatch}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded font-medium transition-colors"
            >
              Leave Match
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 p-3 bg-gray-700 rounded text-center text-sm">
        {statusMessage}
      </div>
    </div>
  );
};