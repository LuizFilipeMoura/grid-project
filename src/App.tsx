import { useEffect, useMemo, useState } from 'react';
import { Client } from 'boardgame.io/react';
import { SocketIO } from 'boardgame.io/multiplayer';
import type { GameState, PlayerID } from './game/types.ts';
import { GridSkirmish } from './game/game.ts';
import { GridBoard } from './components/GridBoard.tsx';
import './App.css';

const resolveServerUrl = () => {
  if (import.meta.env.VITE_SERVER_URL) {
    return import.meta.env.VITE_SERVER_URL as string;
  }
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:8000`;
  }
  return 'http://localhost:8000';
};

const createClient = (server: string) =>
  Client<GameState>({
    game: GridSkirmish,
    board: GridBoard,
    multiplayer: SocketIO({ server }),
    debug: false
  });

type StoredSession = {
  matchID: string;
  playerID: PlayerID;
  credentials: string;
};

const STORAGE_KEY = 'grid-skirmish-session';

const useStoredSession = () => {
  const [session, setSession] = useState<StoredSession | null>(() => {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StoredSession;
    } catch (error) {
      console.warn('Failed to parse stored session', error);
      return null;
    }
  });

  const persist = (value: StoredSession | null) => {
    if (typeof window === 'undefined') return;
    if (value) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    setSession(value);
  };

  return [session, persist] as const;
};

function App() {
  const serverUrl = useMemo(resolveServerUrl, []);
  const GameClient = useMemo(() => createClient(serverUrl), [serverUrl]);
  const [playerID, setPlayerID] = useState<PlayerID>('0');
  const [matchID, setMatchID] = useState('');
  const [credentials, setCredentials] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('Create or join a match to begin.');
  const [isLoading, setIsLoading] = useState(false);
  const [storedSession, storeSession] = useStoredSession();

  useEffect(() => {
    if (!storedSession) return;
    setMatchID(storedSession.matchID);
    setPlayerID(storedSession.playerID);
    setCredentials(storedSession.credentials);
    setStatusMessage('Reconnected using stored credentials.');
  }, [storedSession]);

  const handleCreateMatch = async () => {
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
  };

  const handleJoinMatch = async () => {
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
  };

  const handleLeaveMatch = async () => {
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
      console.warn('Failed to notify server about leaving', error);
    } finally {
      setCredentials(null);
      storeSession(null);
      setIsLoading(false);
      setStatusMessage('Left the match.');
    }
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Grid Tactics Arena</h1>
        <div className="control-bar">
          <button type="button" onClick={handleCreateMatch} disabled={isLoading}>
            Create Match
          </button>
          <label>
            Seat
            <select
              value={playerID}
              onChange={(event) => setPlayerID(event.target.value as PlayerID)}
              disabled={Boolean(credentials)}
            >
              <option value="0">Player 1</option>
              <option value="1">Player 2</option>
            </select>
          </label>
          <label>
            Match ID
            <input value={matchID} onChange={(event) => setMatchID(event.target.value)} disabled={Boolean(credentials)} />
          </label>
          <button type="button" onClick={handleJoinMatch} disabled={isLoading || Boolean(credentials)}>
            Join Match
          </button>
          <button type="button" onClick={handleLeaveMatch} disabled={!credentials}>
            Leave Match
          </button>
        </div>
      </header>
      {!credentials ? (
        <div className="status-banner">
          <strong>Status</strong>
          <span>{statusMessage}</span>
          <span>Start the dedicated server with <code>npm run server</code> in another terminal.</span>
        </div>
      ) : (
        <GameClient key={`${matchID}-${playerID}`} playerID={playerID} matchID={matchID} credentials={credentials} />
      )}
    </div>
  );
}

export default App;
