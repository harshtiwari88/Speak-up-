import React from 'react';

interface WaveformVisualizerProps {
  levels: number[];
  isActive: boolean;
  className?: string;
  barColor?: string;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  levels,
  isActive,
  className = '',
  barColor = 'bg-emerald-400',
}) => {
  // If not active or empty levels, render calm resting bars
  const activeLevels = isActive && levels.length > 0 ? levels : [0.15, 0.25, 0.35, 0.2, 0.3, 0.15, 0.25, 0.18];

  return (
    <div className={`flex items-center justify-center gap-1.5 h-10 px-3 ${className}`}>
      {activeLevels.map((lvl, idx) => {
        const heightPercent = isActive ? Math.max(15, Math.min(100, Math.round(lvl * 100))) : 20;
        return (
          <div
            key={idx}
            className={`w-1 rounded-full transition-all duration-75 ${
              isActive ? `${barColor} shadow-[0_0_8px_rgba(52,211,153,0.5)]` : 'bg-slate-600'
            }`}
            style={{
              height: `${heightPercent}%`,
              animationDelay: `${idx * 0.08}s`,
            }}
          />
        );
      })}
    </div>
  );
};
