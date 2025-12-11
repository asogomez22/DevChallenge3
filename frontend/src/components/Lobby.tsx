import React, { useState } from 'react';
import { Socket } from 'socket.io-client';

// --- Interfaces ---
interface GameData {
  id: string;
  players: any[];
  maxRounds: number;
}
interface LobbyProps {
  status: string;
  displayName: string;
  setDisplayName: (name: string) => void;
  publicGames: GameData[];
  onCreateGame: (isPublic: boolean, maxRounds: number) => void; // 👈 Acepta maxRounds
  onJoinWithCode: (code: string) => void;
  socket: Socket | null;
}

// --- Componente Lobby ---
const Lobby: React.FC<LobbyProps> = ({
  status,
  displayName,
  setDisplayName,
  publicGames,
  onCreateGame,
  onJoinWithCode,
  socket,
}) => {
  const [joinCode, setJoinCode] = useState('');
  const [isCreatingPublic, setIsCreatingPublic] = useState(false);
  // --- 1. NUEVO: Estado para las rondas ---
  const [rounds, setRounds] = useState(1); // 1 ronda por jugador (2 turnos totales)

  return (
    <div className="lobby-background">
      <div className="lobby-container">
        
        <header className="lobby-header">
          <h1>PENALTI <span>CHALLENGE</span></h1>
          <p className="status">Estat: {status}</p>
        </header>

        <main className="lobby-main">
          {/* Columna Izquierda: Jugar */}
          <div className="lobby-column play-column">
            <div className="lobby-box">
              <h3>Partides Públiques</h3>
              <ul className="public-games-list">
                {publicGames.length === 0 ? (
                  <li className="no-games">No hi ha partides. Crea'n una!</li>
                ) : (
                  publicGames.map((g) => (
                    <li key={g.id} onClick={() => onJoinWithCode(g.id)}>
                      <span>
                        Partida de {g.players[0]?.displayName || 'Anònim'}
                        <small> (Rondes: {g.maxRounds / 2})</small>
                      </span>
                      <button className="btn-join-list">Unir-se</button>
                    </li>
                  ))
                )}
              </ul>
            </div>

            <div className="lobby-box">
              <h3>Unir-se amb Codi</h3>
              <div className="join-code-wrapper">
                <input
                  type="text"
                  placeholder="CODI"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={4}
                />
                <button onClick={() => onJoinWithCode(joinCode)} disabled={joinCode.length < 4 || !socket}>
                  Unir-se
                </button>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Perfil y Crear */}
          <div className="lobby-column profile-column">
            <div className="lobby-box">
              <h3>El Teu Perfil</h3>
              <label htmlFor="displayName">El Teu Nom</label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={15}
              />
            </div>

            <div className="lobby-box">
              <h3>Crear Partida</h3>
              
              {/* --- 2. NUEVO: Selector de Rondas --- */}
              <label htmlFor="rounds-select">Rondes per Jugador:</label>
              <select 
                id="rounds-select" 
                value={rounds} 
                onChange={(e) => setRounds(Number(e.target.value))}
              >
                <option value={1}>1 Ronda (Defecte)</option>
                <option value={3}>3 Rondes</option>
                <option value={5}>5 Rondes</option>
              </select>

              <div className="public-toggle">
                <input 
                  type="checkbox" 
                  id="public-check"
                  checked={isCreatingPublic}
                  onChange={(e) => setIsCreatingPublic(e.target.checked)}
                />
                <label htmlFor="public-check">Fer pública</label>
              </div>

              {/* --- 3. NUEVO: Pasa las rondas al crear --- */}
              <button onClick={() => onCreateGame(isCreatingPublic, rounds)} className="btn-create" disabled={!socket}>
                {isCreatingPublic ? 'Crear Partida Pública' : 'Crear Partida Privada'}
              </button>
            </div>
          </div>
        </main>

      </div>
    </div>
  );
};

export default Lobby;