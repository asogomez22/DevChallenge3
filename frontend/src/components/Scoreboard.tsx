// frontend/src/components/Scoreboard.tsx
import React, { useEffect, useState } from 'react';

interface PlayerScore {
  id: string;
  display_name: string;
  total_points: number;
}

const Scoreboard: React.FC = () => {
  const [scores, setScores] = useState<PlayerScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch('http://localhost:4000/api/leaderboard');
        const data = await res.json();
        setScores(data.leaderboard || []);
      } catch (err) {
        console.error('Error fetching leaderboard', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  if (loading) return <p>Cargando tabla de puntuaciones...</p>;
  if (!scores.length) return <p>No hay puntuaciones todavía.</p>;

  return (
    <div style={{ maxWidth: 400, margin: '0 auto', textAlign: 'center' }}>
      <h2>Leaderboard</h2>
      <ol>
        {scores.map((player) => (
          <li key={player.id}>
            {player.display_name}: {player.total_points} pts
          </li>
        ))}
      </ol>
    </div>
  );
};

export default Scoreboard;
