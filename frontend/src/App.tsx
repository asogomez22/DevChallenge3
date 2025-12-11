import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import Goal from './components/Goal';
import Lobby from './components/Lobby';
import { useSound } from './hooks/useSound';
import './App.css'; 

// Interfaces
interface PlayerStat { displayName: string; score: number; }
interface GameData {
  id: string;
  players: any[];
  currentRound: number;
  maxRounds: number;
  myRole: 'shooter' | 'goalkeeper';
  scores: { [userId: string]: number };
  phase: 'waiting' | 'playing' | 'finished';
  isPublic: boolean;
}

function App() {
  const [view, setView] = useState<'splash' | 'home' | 'game'>('splash');
  const [displayName, setDisplayName] = useState(`Jugador${Math.floor(Math.random() * 1000)}`);
  const [socket, setSocket] = useState<Socket | null>(null);
  
  const [publicGames, setPublicGames] = useState<GameData[]>([]);
  const [status, setStatus] = useState('Connectant...');

  const [game, setGame] = useState<GameData | null>(null);
  // Ref para acceder al estado dentro de los callbacks de socket
  const gameRef = useRef<GameData | null>(null);

  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  const [notification, setNotification] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<number | null>(null);
  const [result, setResult] = useState<any>(null); // 👈 Estat que cal netejar
  const [winner, setWinner] = useState<string | null>(null);
  const [finalStats, setFinalStats] = useState<PlayerStat[] | null>(null);
  
  const [showBotButton, setShowBotButton] = useState(false);
  const [botTimer, setBotTimer] = useState<number | null>(null);

  const [playSound] = useSound({
    click: '/sounds/click.mp3',
    goal: '/sounds/goal.mp3',
    save: '/sounds/save.mp3',
    whistle: '/sounds/whistle.mp3',
  });

  useEffect(() => {
    // ✅ AHORA (Producción)
    const newSocket = io('https://devchallenge3.onrender.com');
    setSocket(newSocket);
    newSocket.on('connect', () => {
      setStatus('Connectat');
      newSocket.emit('get_public_games');
      setTimeout(() => setView('home'), 1000); 
    });
    newSocket.on('public_games_list', (games: GameData[]) => setPublicGames(games));
    
    newSocket.on('game_created', ({ game }) => {
      playSound('whistle');
      setGame(game);
      setView('game');
      // --- 🟢 Netejar estat antic ---
      setResult(null);
      setSelectedZone(null);
      
      if (game.isPublic) {
        setStatus('Esperant rival... (Bot en 10s)');
        if (botTimer) clearTimeout(botTimer);
        const timer = setTimeout(() => { setShowBotButton(true); }, 10000);
        setBotTimer(timer);
      } else {
        setStatus(`Codi: ${game.id}. Esperant rival...`);
      }
    });

    newSocket.on('error_joining', ({ message }) => {
      alert(`Error: ${message}`);
      setStatus('Connectat');
    });

    newSocket.on('bot_joined', () => {
        setStatus('🤖 S\'ha unit un Bot Rival!');
        playSound('whistle');
    });

    newSocket.on('match_start', ({ game }) => {
      const myPlayer = game.players.find((p: any) => p.userId === newSocket.id);
      // --- 🟢 Netejar estat antic ---
      setGame({ ...game, myRole: myPlayer.role, phase: game.phase });
      setView('game');
      setResult(null);
      setSelectedZone(null);
      
      if (botTimer) clearTimeout(botTimer);
      setShowBotButton(false);
      if (status !== '🤖 S\'ha unit un Bot Rival!') {
           playSound('whistle');
      }
    });
    
    newSocket.on('round_start', (data) => {
      setResult(null);
      setSelectedZone(null);
      setGame(g => g ? ({ ...g, currentRound: data.round, myRole: data.role }) : null);
      const msg = data.role === 'shooter' ? '¡TE TOCA XUTAR!' : '¡TE TOCA PARAR!';
      setNotification(msg);
      setTimeout(() => setNotification(null), 2000);
    });

    newSocket.on('round_result', (data) => {
      setResult(data);
      const isShooter = gameRef.current?.myRole === 'shooter';
      const pointsSuffix = isShooter ? '' : ` (Porter: ${data.keeperPointsAwarded} ${data.keeperPointsAwarded === 1 ? 'Pt' : 'Pts'})`;

      if (data.isGoal) {
        playSound('goal');
        // Si no es porter, solo muestra ¡GOL!
        if (isShooter) {
             setStatus('¡GOL!' + pointsSuffix);
        } else {
            // Si es porter, muestra los puntos
            if (data.keeperPointsAwarded === 1) {
                 setStatus('¡GOL! (Porter: 1 Pt)');
            } else {
                 setStatus('¡GOL! (Porter: 0 Pts)');
            }
        }
      } else {
        playSound('save');
        setStatus(`¡PARADÓN!${pointsSuffix}`);
      }
    });

    newSocket.on('match_end', (data: { winner: string, stats: PlayerStat[] }) => {
      setWinner(data.winner);
      setFinalStats(data.stats);
    });
    
    newSocket.on('opponent_left', () => {
      alert('¡El teu rival s\'ha desconnectat!');
      handleLeaveGame();
    });
    return () => { newSocket.disconnect(); };
  }, []); // Dependencia vacía

  const handleCreateGame = (isPublic: boolean, maxRounds: number) => {
    if (socket) {
      playSound('click');
      socket.emit('create_game', { displayName, isPublic, maxRounds });
    }
  };
  const handleJoinWithCode = (code: string) => {
    if (socket) {
      playSound('click');
      socket.emit('join_game', { gameCode: code.toUpperCase(), displayName });
    }
  };

  const handleRequestBotGame = () => {
    if (socket && game) {
      playSound('click');
      socket.emit('request_bot_game', { gameCode: game.id });
      setShowBotButton(false); 
      if (botTimer) clearTimeout(botTimer);
    }
  };

  const handleZoneSelect = (zoneId: number) => {
    if (selectedZone !== null || !game || !socket) return;
    playSound('click');
    setSelectedZone(zoneId);
    socket.emit('select_choice', {
      gameCode: game.id,
      zoneId: Number(zoneId)
    });
  };

  // --- 🟢 Funció de sortida Netejada ---
  const handleLeaveGame = () => {
    setView('home');
    setGame(null);
    setWinner(null);
    setFinalStats(null);
    setStatus('Connectat');
    setResult(null); // 👈 Netejar la última jugada
    setSelectedZone(null); // 👈 Netejar la última jugada
    socket?.emit('get_public_games');
    
    if (botTimer) clearTimeout(botTimer);
    setShowBotButton(false);
  };

  if (view === 'splash') {
    return (
      <div className="splash-screen">
        <h1>PENALTI CHALLENGE</h1>
        <div className="loader"></div>
        <p>{status}...</p>
      </div>
    );
  }
  
  if (view === 'home') {
    return (
      <Lobby
        status={status}
        displayName={displayName}
        setDisplayName={setDisplayName}
        publicGames={publicGames}
        onCreateGame={handleCreateGame}
        onJoinWithCode={handleJoinWithCode}
        socket={socket}
      />
    );
  }
  
  if (view === 'game' && game) {
    // EL FONS I EL CONTENIDOR S'HAN DE RENDERITZAR AQUÍ
    return (
      <div className="game-container">
        <div className="stadium-background"></div>
        
        {notification && <div className="role-notification"><h1>{notification}</h1></div>}
        
        <div className="hud">
          {game.phase === 'waiting' ? (
            game.isPublic ? (
              <h2>BUSCANT RIVAL...</h2>
            ) : (
              <h2>CODI: <span className="game-code-display">{game.id}</span></h2>
            )
          ) : (
            <h2>RONDA {Math.ceil(game.currentRound / 2)} / {game.maxRounds / 2}</h2>
          )}
          <h3>{status}</h3>
        </div>

        <Goal 
          role={game.myRole}
          selectedZone={selectedZone}
          onZoneSelect={handleZoneSelect}
          result={result} // 👈 Passar el 'result' (que ara es neteja bé)
          disabled={selectedZone !== null || result !== null || game.phase === 'waiting'}
        />

        {winner && finalStats && (
          <div className="winner-overlay">
            <h1>🏆 {winner === 'Empate' ? 'EMPATE' : `${winner} GUANYA!`} 🏆</h1>
            <table className="stats-table">
              <thead><tr><th>Jugador</th><th>Punts (Porter)</th></tr></thead>
              <tbody>
                {finalStats.map(stat => (
                  <tr key={stat.displayName}>
                    <td>{stat.displayName}</td>
                    <td>{stat.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={handleLeaveGame}>Tornar al Lobby</button>
          </div>
        )}
        
        {game.phase === 'waiting' && game.isPublic && showBotButton && (
            <div className="bot-prompt">
                <p>No es troba rival. Vols jugar contra un bot?</p>
                <button onClick={handleRequestBotGame} className="btn-bot-yes">Sí, jugar amb Bot</button>
                <button onClick={() => setShowBotButton(false)} className="btn-bot-no">No, seguir esperant</button>
            </div>
        )}
        
        {game.phase === 'waiting' && (
           <button onClick={handleLeaveGame} className="leave-btn">Cancel·lar</button>
        )}
      </div>
    );
  }
  return <div>Carregant...</div>;
}

export default App;