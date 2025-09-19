import { useStoredSession } from './hooks/useStoredSession';
import { GameRoom } from './components/layout/GameRoom';
import './App.css';

function App() {
  const [storedSession, storeSession] = useStoredSession();

  return (
    <GameRoom
      storedSession={storedSession}
      storeSession={storeSession}
    />
  );
}

export default App;