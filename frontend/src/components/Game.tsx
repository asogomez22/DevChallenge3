import React, { useEffect, useState } from 'react';
import socket from '../api/socket';

interface Choice {
  height: 'low' | 'mid' | 'high';
  side: 'left' | 'center' | 'right';
}

interface GameProps {
  matchId: string;
  playerId: string;
}

export const Game: React.FC<GameProps> = ({ matchId, playerId }) => {
  const [round, setRound] = useState(1);
  const [choice, setChoice] = useState<Choice | null>(null);

  useEffect(() => {
    socket.on('round_start', (data) => {
      console.log('Ronda iniciada:', data);
      setRound(data.round);
      setChoice(null);
    });

    socket.on('round_result', (data) => {
      console.log('Resultado ronda:', data);
      alert(`Ronda ${data.round} resultado!`);
    });

    socket.on('match_end', (data) => {
      alert(`Partida finalizada. Ganador: ${data.winner}`);
    });

    return () => {
      socket.off('round_start');
      socket.off('round_result');
      socket.off('match_end');
    };
  }, []);

  const sendChoice = (height: Choice['height'], side: Choice['side']) => {
    const c: Choice = { height, side };
    setChoice(c);
    socket.emit('select_choice', { matchId, playerId, ...c });
  };

  return (
    <div>
      <h2>Ronda {round}</h2>
      {!choice ? (
        <div>
          <h3>Elige altura y lado:</h3>
          {['low', 'mid', 'high'].map((h) =>
            ['left', 'center', 'right'].map((s) => (
              <button key={`${h}-${s}`} onClick={() => sendChoice(h as any, s as any)}>
                {h}-{s}
              </button>
            ))
          )}
        </div>
      ) : (
        <p>Esperando al rival...</p>
      )}
    </div>
  );
};
