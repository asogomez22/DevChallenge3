import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface MatchProps {
  matchId: string;
}

const Match: React.FC<MatchProps> = ({ matchId }) => {
  const [round, setRound] = useState(1);
  const [scores, setScores] = useState({ shooter: 0, keeper: 0 });
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const s = io('http://localhost:4000');
    setSocket(s);

    s.on('connect', () => {
      console.log('Conectado al match', matchId);
    });

    s.on('round_start', (data: any) => {
      console.log('Ronda iniciada', data);
      setRound(data.round);
    });

    s.on('round_result', (data: any) => {
      console.log('Resultado de ronda', data);
      setScores(data.scores);
    });

    s.on('match_end', (data: any) => {
      console.log('Partida finalizada', data);
      alert(`Partida terminada. Ganador: ${data.winner}`);
    });

    return () => {
      s.disconnect();
    };
  }, [matchId]);

  const choose = (height: 'low'|'mid'|'high', side: 'left'|'center'|'right') => {
    if (!socket) return;
    socket.emit('select_choice', { matchId, playerId: `user_${socket.id}`, height, side });
  };

  return (
    <div>
      <h2>Ronda {round}</h2>
      <p>Puntuaciones: Shooter {scores.shooter} - Keeper {scores.keeper}</p>
      <div>
        <button onClick={() => choose('low', 'left')}>Chutar: Low Left</button>
        <button onClick={() => choose('mid', 'center')}>Chutar: Mid Center</button>
        <button onClick={() => choose('high', 'right')}>Chutar: High Right</button>
      </div>
    </div>
  );
};

export default Match;
