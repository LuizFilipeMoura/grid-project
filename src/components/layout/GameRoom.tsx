import { useMemo } from 'react';
import { resolveServerUrl, createClient } from '../../lib/client';
import { MatchLobby } from '../ui/MatchLobby';
import { useMatchManager } from '../../hooks/useMatchManager';

type StoredSession = { matchID: string; playerID: string; credentials: string };

interface GameRoomProps {
  storedSession: StoredSession | null;
  // eslint-disable-next-line no-unused-vars
  storeSession: (session: StoredSession | null) => void;
}

export const GameRoom = ({ storedSession, storeSession }: GameRoomProps) => {
  const serverUrl = useMemo(resolveServerUrl, []);
  const GameClient = useMemo(() => createClient(serverUrl), [serverUrl]);

  const {
    matchID,
    setMatchID,
    playerID,
    setPlayerID,
    credentials,
    setCredentials,
    statusMessage,
    setStatusMessage,
    isLoading,
    handleCreateMatch,
    handleJoinMatch,
    handleLeaveMatch
  } = useMatchManager({ serverUrl, storeSession });

  // Restore session if available
  if (storedSession && !credentials) {
    setMatchID(storedSession.matchID);
    setPlayerID(storedSession.playerID as '0' | '1');
    setCredentials(storedSession.credentials);
    setStatusMessage('Reconnected using stored credentials.');
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <MatchLobby
          matchID={matchID}
          setMatchID={setMatchID}
          playerID={playerID as '0' | '1'}
          setPlayerID={setPlayerID}
          statusMessage={statusMessage}
          isLoading={isLoading}
          onCreateMatch={handleCreateMatch}
          onJoinMatch={handleJoinMatch}
          onLeaveMatch={handleLeaveMatch}
          credentials={credentials}
        />

        {credentials && matchID && (
          <div className="rounded-lg overflow-hidden bg-gray-800">
            <GameClient
              matchID={matchID}
              playerID={playerID}
              credentials={credentials}
            />
          </div>
        )}
      </div>
    </div>
  );
};