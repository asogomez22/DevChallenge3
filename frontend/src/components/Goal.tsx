import React from 'react';
// ⚠️ NO IMPORTAR 'Goal.css'

interface GoalProps {
  role: 'shooter' | 'goalkeeper';
  onZoneSelect: (zoneId: number) => void;
  selectedZone: number | null;
  result?: {
    shooterZone: number;
    keeperZone: number;
    isGoal: boolean;
  } | null;
  disabled: boolean;
}

const Goal: React.FC<GoalProps> = ({ role, onZoneSelect, selectedZone, result, disabled }) => {
  const zones = Array.from({ length: 9 }, (_, i) => i);

  // Clases para el cursor
  const cursorClass = disabled ? 'disabled-cursor' : (role === 'shooter' ? 'shooter-cursor' : 'keeper-cursor');

  return (
    // ⚠️ 'goal-container' YA NO ESTÁ AQUÍ, ESTÁ EN APP.TSX
    <div className={`goal-wrapper ${cursorClass}`}> {/* Wrapper simple */}
      <div className="goal-frame">
        <div className="goal-net">
          {zones.map((zoneId) => (
            <div
              key={zoneId}
              className={`goal-zone ${selectedZone === zoneId ? 'selected-myself' : ''}`}
              onClick={() => !disabled && onZoneSelect(zoneId)}
            >
              {/* Animación del Balón */}
              {result && result.shooterZone === zoneId && (
                <div className="ball-animation-wrapper">
                  <div className="ball-animation">⚽</div>
                </div>
              )}

              {/* Animación del Portero */}
              {result && result.keeperZone === zoneId && (
                 <div className="keeper-animation-wrapper">
                  <div className="keeper-animation">🧤</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="instruction">
        {disabled ? 'Esperant al rival...' : (role === 'shooter' ? '🎯 Tria on xutar' : '🧤 Tria on parar')}
      </div>
    </div>
  );
};

export default Goal;