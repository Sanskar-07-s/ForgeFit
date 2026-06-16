// ForgeFit AI - Muscle Heatmap System (v5.1)

import React from 'react';
import { GlassCard } from './GlassCard';

interface Props {
  exerciseName: string;
  className?: string;
}

interface MuscleDetail {
  name: string;
  type: 'primary' | 'secondary' | 'stabilizer';
  percentage: number;
}

// Map exercise names to their anatomical activation levels
const GET_MUSCLE_ACTIVATION = (exercise: string): MuscleDetail[] => {
  const name = exercise.toLowerCase();
  if (name.includes('bench press') || name.includes('pushup') || name.includes('push up')) {
    return [
      { name: 'Chest', type: 'primary', percentage: 92 },
      { name: 'Shoulders', type: 'secondary', percentage: 76 },
      { name: 'Triceps', type: 'secondary', percentage: 68 },
      { name: 'Core', type: 'stabilizer', percentage: 25 },
    ];
  }
  if (name.includes('squat')) {
    return [
      { name: 'Legs', type: 'primary', percentage: 95 },
      { name: 'Glutes', type: 'secondary', percentage: 80 },
      { name: 'Core', type: 'stabilizer', percentage: 40 },
      { name: 'Calves', type: 'stabilizer', percentage: 30 },
    ];
  }
  if (name.includes('deadlift')) {
    return [
      { name: 'Back', type: 'primary', percentage: 88 },
      { name: 'Legs', type: 'primary', percentage: 82 },
      { name: 'Glutes', type: 'secondary', percentage: 85 },
      { name: 'Core', type: 'stabilizer', percentage: 65 },
      { name: 'Forearms', type: 'stabilizer', percentage: 50 },
    ];
  }
  if (name.includes('pull up') || name.includes('pullup') || name.includes('lat pulldown')) {
    return [
      { name: 'Back', type: 'primary', percentage: 94 },
      { name: 'Biceps', type: 'secondary', percentage: 70 },
      { name: 'Forearms', type: 'secondary', percentage: 45 },
      { name: 'Core', type: 'stabilizer', percentage: 30 },
    ];
  }
  if (name.includes('shoulder press') || name.includes('overhead press')) {
    return [
      { name: 'Shoulders', type: 'primary', percentage: 90 },
      { name: 'Triceps', type: 'secondary', percentage: 65 },
      { name: 'Core', type: 'stabilizer', percentage: 35 },
    ];
  }
  if (name.includes('bicep curl') || name.includes('biceps')) {
    return [
      { name: 'Biceps', type: 'primary', percentage: 96 },
      { name: 'Forearms', type: 'secondary', percentage: 55 },
      { name: 'Core', type: 'stabilizer', percentage: 15 },
    ];
  }
  if (name.includes('tricep pushdown') || name.includes('triceps')) {
    return [
      { name: 'Triceps', type: 'primary', percentage: 94 },
      { name: 'Chest', type: 'secondary', percentage: 40 },
      { name: 'Core', type: 'stabilizer', percentage: 20 },
    ];
  }
  if (name.includes('leg press')) {
    return [
      { name: 'Legs', type: 'primary', percentage: 88 },
      { name: 'Glutes', type: 'secondary', percentage: 60 },
      { name: 'Calves', type: 'stabilizer', percentage: 25 },
    ];
  }
  // Default fallback
  return [
    { name: 'Core', type: 'primary', percentage: 50 },
  ];
};

const mapToSvgId = (name: string): string => {
  const n = name.toLowerCase();
  if (n.includes('chest')) return 'chest';
  if (n.includes('back')) return 'back';
  if (n.includes('shoulder')) return 'shoulders';
  if (n.includes('bicep')) return 'biceps';
  if (n.includes('tricep')) return 'triceps';
  if (n.includes('core') || n.includes('abs')) return 'core';
  if (n.includes('leg') || n.includes('quad') || n.includes('hamstring')) return 'legs';
  if (n.includes('glute')) return 'glutes';
  if (n.includes('calf') || n.includes('calves')) return 'calves';
  if (n.includes('forearm')) return 'forearms';
  return 'core';
};

export const MuscleHeatmap: React.FC<Props> = ({ exerciseName, className = '' }) => {
  const muscles = GET_MUSCLE_ACTIVATION(exerciseName);

  const getPartColor = (partId: string): string => {
    const matched = muscles.find(m => mapToSvgId(m.name) === partId);
    if (!matched) return 'rgba(255, 255, 255, 0.05)';
    if (matched.type === 'primary') return '#22D3EE'; // Neon Cyan
    if (matched.type === 'secondary') return '#8B5CF6'; // Purple Glow
    return '#EAB308'; // Yellow/Stabilizer
  };

  const getPartGlow = (partId: string): string => {
    const matched = muscles.find(m => mapToSvgId(m.name) === partId);
    if (!matched) return 'none';
    if (matched.type === 'primary') return 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.8))';
    if (matched.type === 'secondary') return 'drop-shadow(0 0 6px rgba(139, 92, 246, 0.6))';
    return 'none';
  };

  const primaryList = muscles.filter(m => m.type === 'primary');
  const secondaryList = muscles.filter(m => m.type === 'secondary');
  const stabilizerList = muscles.filter(m => m.type === 'stabilizer');

  return (
    <GlassCard className={`p-5 rounded-2xl flex flex-col md:flex-row items-center justify-around gap-6 relative overflow-hidden ${className}`} glowColor="#22D3EE">
      {/* Dynamic SVG Body highlights */}
      <div className="w-[120px] h-[210px] shrink-0">
        <svg viewBox="0 0 100 200" className="w-full h-full overflow-visible">
          {/* Head */}
          <circle cx="50" cy="18" r="10" fill={getPartColor('head')} style={{ filter: getPartGlow('head'), transition: 'fill 0.4s ease' }} />
          {/* Neck */}
          <rect x="47" y="27" width="6" height="6" fill="rgba(255,255,255,0.05)" />
          {/* Shoulders */}
          <path d="M26 36 C28 32, 72 32, 74 36 L78 44 L72 46 L68 38 L32 38 L28 46 L22 44 Z" fill={getPartColor('shoulders')} style={{ filter: getPartGlow('shoulders'), transition: 'fill 0.4s ease' }} />
          {/* Chest */}
          <path d="M32 40 L68 40 L66 62 L34 62 Z" fill={getPartColor('chest')} style={{ filter: getPartGlow('chest'), transition: 'fill 0.4s ease' }} />
          {/* Biceps */}
          <rect x="19" y="44" width="8" height="20" rx="3" fill={getPartColor('biceps')} style={{ filter: getPartGlow('biceps'), transition: 'fill 0.4s ease' }} />
          <rect x="73" y="44" width="8" height="20" rx="3" fill={getPartColor('biceps')} style={{ filter: getPartGlow('biceps'), transition: 'fill 0.4s ease' }} />
          {/* Forearms */}
          <rect x="17" y="66" width="7" height="22" rx="2" fill={getPartColor('forearms')} style={{ filter: getPartGlow('forearms'), transition: 'fill 0.4s ease' }} />
          <rect x="76" y="66" width="7" height="22" rx="2" fill={getPartColor('forearms')} style={{ filter: getPartGlow('forearms'), transition: 'fill 0.4s ease' }} />
          {/* Abs / Core */}
          <rect x="36" y="65" width="28" height="28" rx="2" fill={getPartColor('core')} style={{ filter: getPartGlow('core'), transition: 'fill 0.4s ease' }} />
          {/* Glutes */}
          <path d="M34 94 L66 94 L62 108 L38 108 Z" fill={getPartColor('glutes')} style={{ filter: getPartGlow('glutes'), transition: 'fill 0.4s ease' }} />
          {/* Legs */}
          <rect x="31" y="110" width="15" height="36" rx="4" fill={getPartColor('legs')} style={{ filter: getPartGlow('legs'), transition: 'fill 0.4s ease' }} />
          <rect x="54" y="110" width="15" height="36" rx="4" fill={getPartColor('legs')} style={{ filter: getPartGlow('legs'), transition: 'fill 0.4s ease' }} />
          {/* Calves */}
          <rect x="32" y="148" width="11" height="30" rx="3" fill={getPartColor('calves')} style={{ filter: getPartGlow('calves'), transition: 'fill 0.4s ease' }} />
          <rect x="57" y="148" width="11" height="30" rx="3" fill={getPartColor('calves')} style={{ filter: getPartGlow('calves'), transition: 'fill 0.4s ease' }} />
        </svg>
      </div>

      {/* Target & Secondary Legend details */}
      <div className="flex-1 flex flex-col justify-center space-y-4 max-w-[200px] text-xs">
        <div>
          <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Primary Target (Neon Cyan)</span>
          <div className="space-y-1.5 mt-1">
            {primaryList.map(m => (
              <div key={m.name} className="flex justify-between items-center bg-brand-cyan/5 border border-brand-cyan/25 rounded-lg px-2.5 py-1 text-white font-bold">
                <span>{m.name}</span>
                <span className="text-brand-cyan text-[10px]">{m.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {secondaryList.length > 0 && (
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Secondary Target (Purple)</span>
            <div className="space-y-1.5 mt-1">
              {secondaryList.map(m => (
                <div key={m.name} className="flex justify-between items-center bg-brand-purple/5 border border-brand-purple/20 rounded-lg px-2.5 py-1 text-white font-bold">
                  <span>{m.name}</span>
                  <span className="text-brand-purple text-[10px]">{m.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {stabilizerList.length > 0 && (
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Stabilizers (Yellow)</span>
            <div className="flex flex-wrap gap-1 mt-1 text-[10px] text-slate-400 font-semibold">
              {stabilizerList.map(m => m.name).join(' • ')}
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  );
};
