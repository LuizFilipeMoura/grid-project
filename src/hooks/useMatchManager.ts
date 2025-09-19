import { useState, useCallback } from 'react';
import type { PlayerID } from '../types';
import { GridSkirmish } from '../game';

type SessionRecord = { matchID: string; playerID: PlayerID; credentials: string };

interface UseMatchManagerProps {
  serverUrl: string;
  // eslint-disable-next-line no-unused-vars
  storeSession: (session: SessionRecord | null) => void;
}

export const useMatchManager = ({ serverUrl, storeSession }: UseMatchManagerProps) => {
  const [matchID, setMatchID] = useState('');
  const [playerID, setPlayerID] = useState<PlayerID>('0');
  const [credentials, setCredentials] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('Create or join a match to begin.');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateMatch = useCallback(async () => {
    setIsLoading(true);
    setStatusMessage('Creating match...');
    try {
      const response = await fetch(`${serverUrl}/games/${GridSkirmish.name}/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numPlayers: 2 })
      });
      if (!response.ok) {
        throw new Error('Failed to create match');
      }
      const data = (await response.json()) as { matchID: string };
      setMatchID(data.matchID);
      setCredentials(null);
      storeSession(null);
      setStatusMessage(`Match ready. Share ID ${data.matchID} with your opponent.`);
    } catch (error) {
      console.error(error);
      setStatusMessage('Unable to create match. Is the server running?');
    } finally {
      setIsLoading(false);
    }
  }, [serverUrl, storeSession]);

  const handleJoinMatch = useCallback(async () => {
    if (!matchID) {
      setStatusMessage('Enter a match ID to join.');
      return;
    }
    setIsLoading(true);
    setStatusMessage('Joining match...');
    try {
      const response = await fetch(`${serverUrl}/games/${GridSkirmish.name}/${matchID}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerID, playerName: `Player ${Number(playerID) + 1}` })
      });
      if (!response.ok) {
        if (response.status === 409) {
          setStatusMessage('Seat already claimed. Choose another slot or new match.');
        } else {
          setStatusMessage('Unable to join the match.');
        }
        return;
      }
      const data = (await response.json()) as { playerCredentials: string };
      setCredentials(data.playerCredentials);
      setStatusMessage('Connected. Deploy your squad!');
      storeSession({ matchID, playerID, credentials: data.playerCredentials });
    } catch (error) {
      console.error(error);
      setStatusMessage('Network error while joining match.');
    } finally {
      setIsLoading(false);
    }
  }, [serverUrl, matchID, playerID, storeSession]);

  const handleLeaveMatch = useCallback(async () => {
    if (!matchID || !credentials) {
      setCredentials(null);
      storeSession(null);
      setStatusMessage('Ready for a new assignment.');
      return;
    }
    setIsLoading(true);
    try {
      await fetch(`${serverUrl}/games/${GridSkirmish.name}/${matchID}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerID, credentials })
      });
    } catch (error) {
      console.error(error);
    } finally {
      setCredentials(null);
      storeSession(null);
      setStatusMessage('Ready for a new assignment.');
      setIsLoading(false);
    }
  }, [serverUrl, matchID, playerID, credentials, storeSession]);

  return {
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
  };
};