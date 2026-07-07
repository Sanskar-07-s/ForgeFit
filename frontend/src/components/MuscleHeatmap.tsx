// ForgeFit AI - Muscle Heatmap System (v6.0)
import React, { useState } from 'react';
import { GlassCard } from './GlassCard';
import { Info, HelpCircle } from 'lucide-react';

interface Props {
  exerciseName: string;
  className?: string;
}

interface MuscleDetail {
  name: string;
  type: 'primary' | 'secondary' | 'stabilizer';
  percentage: number;
}

// Complete anatomical load mappings for all 15 exercises
const GET_MUSCLE_ACTIVATION = (exercise: string): MuscleDetail[] => {
  const name = exercise.toLowerCase();
  if (name.includes('bench press') || name.includes('push up') || name.includes('push-up') || name.includes('pushup')) {
    return [
      { name: 'Chest', type: 'primary', percentage: 100 },
      { name: 'Triceps', type: 'secondary', percentage: 70 },
      { name: 'Front Delts', type: 'secondary', percentage: 70 },
      { name: 'Forearms', type: 'stabilizer', percentage: 40 },
      { name: 'Core', type: 'stabilizer', percentage: 40 },
    ];
  }
  if (name.includes('squat')) {
    return [
      { name: 'Quads', type: 'primary', percentage: 100 },
      { name: 'Glutes', type: 'secondary', percentage: 70 },
      { name: 'Hamstrings', type: 'secondary', percentage: 70 },
      { name: 'Calves', type: 'stabilizer', percentage: 40 },
      { name: 'Core', type: 'stabilizer', percentage: 40 },
    ];
  }
  if (name.includes('deadlift')) {
    return [
      { name: 'Hamstrings', type: 'primary', percentage: 100 },
      { name: 'Glutes', type: 'secondary', percentage: 70 },
      { name: 'Lower Back', type: 'secondary', percentage: 70 },
      { name: 'Traps', type: 'stabilizer', percentage: 40 },
      { name: 'Forearms', type: 'stabilizer', percentage: 40 },
      { name: 'Core', type: 'stabilizer', percentage: 40 },
    ];
  }
  if (name.includes('pull up') || name.includes('pullup')) {
    return [
      { name: 'Lats', type: 'primary', percentage: 100 },
      { name: 'Biceps', type: 'secondary', percentage: 70 },
      { name: 'Traps', type: 'secondary', percentage: 70 },
      { name: 'Forearms', type: 'stabilizer', percentage: 40 },
      { name: 'Core', type: 'stabilizer', percentage: 40 },
    ];
  }
  if (name.includes('shoulder press')) {
    return [
      { name: 'Front Delts', type: 'primary', percentage: 100 },
      { name: 'Triceps', type: 'secondary', percentage: 70 },
      { name: 'Core', type: 'stabilizer', percentage: 40 },
    ];
  }
  if (name.includes('bicep curl')) {
    return [
      { name: 'Biceps', type: 'primary', percentage: 100 },
      { name: 'Forearms', type: 'secondary', percentage: 70 },
      { name: 'Core', type: 'stabilizer', percentage: 40 },
    ];
  }
  if (name.includes('tricep pushdown')) {
    return [
      { name: 'Triceps', type: 'primary', percentage: 100 },
      { name: 'Front Delts', type: 'secondary', percentage: 70 },
      { name: 'Core', type: 'stabilizer', percentage: 40 },
    ];
  }
  if (name.includes('leg press')) {
    return [
      { name: 'Quads', type: 'primary', percentage: 100 },
      { name: 'Glutes', type: 'secondary', percentage: 70 },
      { name: 'Hamstrings', type: 'secondary', percentage: 70 },
      { name: 'Calves', type: 'stabilizer', percentage: 40 },
    ];
  }
  if (name.includes('lat pulldown')) {
    return [
      { name: 'Lats', type: 'primary', percentage: 100 },
      { name: 'Biceps', type: 'secondary', percentage: 70 },
      { name: 'Traps', type: 'secondary', percentage: 70 },
      { name: 'Forearms', type: 'stabilizer', percentage: 40 },
    ];
  }
  if (name.includes('seated row')) {
    return [
      { name: 'Lats', type: 'primary', percentage: 100 },
      { name: 'Traps', type: 'secondary', percentage: 70 },
      { name: 'Biceps', type: 'secondary', percentage: 70 },
      { name: 'Forearms', type: 'stabilizer', percentage: 40 },
      { name: 'Core', type: 'stabilizer', percentage: 40 },
    ];
  }
  if (name.includes('leg extension')) {
    return [
      { name: 'Quads', type: 'primary', percentage: 100 },
      { name: 'Core', type: 'stabilizer', percentage: 40 },
    ];
  }
  if (name.includes('leg curl')) {
    return [
      { name: 'Hamstrings', type: 'primary', percentage: 100 },
      { name: 'Glutes', type: 'secondary', percentage: 70 },
      { name: 'Calves', type: 'stabilizer', percentage: 40 },
    ];
  }
  if (name.includes('calf raise')) {
    return [
      { name: 'Calves', type: 'primary', percentage: 100 },
      { name: 'Core', type: 'stabilizer', percentage: 40 },
    ];
  }
  if (name.includes('plank')) {
    return [
      { name: 'Core', type: 'primary', percentage: 100 },
      { name: 'Front Delts', type: 'secondary', percentage: 70 },
      { name: 'Quads', type: 'secondary', percentage: 70 },
      { name: 'Glutes', type: 'stabilizer', percentage: 40 },
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
  if (n.includes('lats')) return 'lats';
  if (n.includes('lower back')) return 'lower_back';
  if (n.includes('trap')) return 'traps';
  if (n.includes('front delt')) return 'front_delts';
  if (n.includes('rear delt')) return 'rear_delts';
  if (n.includes('bicep')) return 'biceps';
  if (n.includes('tricep')) return 'triceps';
  if (n.includes('core')) return 'core';
  if (n.includes('quad') || n.includes('legs')) return 'quads';
  if (n.includes('hamstring')) return 'hamstrings';
  if (n.includes('glute')) return 'glutes';
  if (n.includes('calf') || n.includes('calves')) return 'calves';
  if (n.includes('forearm')) return 'forearms';
  return '';
};

export const MuscleHeatmap: React.FC<Props> = ({ exerciseName, className = '' }) => {
  const [view, setView] = useState<'front' | 'back'>('front');
  const [hovered, setHovered] = useState<MuscleDetail | null>(null);

  const muscles = GET_MUSCLE_ACTIVATION(exerciseName);

  const getPartStyle = (partId: string) => {
    const matched = muscles.find(m => mapToSvgId(m.name) === partId);
    if (!matched) {
      return {
        fill: 'rgba(255, 255, 255, 0.03)',
        stroke: 'rgba(255, 255, 255, 0.08)',
        strokeWidth: '0.5',
        filter: 'none',
        transition: 'all 0.3s ease',
        cursor: 'default',
      };
    }

    let fill = 'rgba(255, 255, 255, 0.05)';
    let stroke = 'rgba(255, 255, 255, 0.2)';
    let filter = 'none';

    const isHovered = hovered && mapToSvgId(hovered.name) === partId;

    if (matched.type === 'primary') {
      fill = isHovered ? 'rgba(34, 211, 238, 0.8)' : 'rgba(34, 211, 238, 0.45)';
      stroke = '#22D3EE';
      filter = isHovered ? 'drop-shadow(0 0 10px #22D3EE)' : 'drop-shadow(0 0 4px rgba(34, 211, 238, 0.5))';
    } else if (matched.type === 'secondary') {
      fill = isHovered ? 'rgba(139, 92, 246, 0.8)' : 'rgba(139, 92, 246, 0.35)';
      stroke = '#8B5CF6';
      filter = isHovered ? 'drop-shadow(0 0 8px #8B5CF6)' : 'drop-shadow(0 0 3px rgba(139, 92, 246, 0.4))';
    } else if (matched.type === 'stabilizer') {
      fill = isHovered ? 'rgba(96, 165, 250, 0.8)' : 'rgba(96, 165, 250, 0.25)';
      stroke = '#60A5FA';
      filter = isHovered ? 'drop-shadow(0 0 6px #60A5FA)' : 'drop-shadow(0 0 2px rgba(96, 165, 250, 0.3))';
    }

    return {
      fill,
      stroke,
      strokeWidth: isHovered ? '1.5' : '1.0',
      filter,
      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'pointer',
    };
  };

  const handleMouseEnter = (partId: string) => {
    const matched = muscles.find(m => mapToSvgId(m.name) === partId);
    if (matched) {
      setHovered(matched);
    }
  };

  const handleMouseLeave = () => {
    setHovered(null);
  };

  const primaryList = muscles.filter(m => m.type === 'primary');
  const secondaryList = muscles.filter(m => m.type === 'secondary');
  const stabilizerList = muscles.filter(m => m.type === 'stabilizer');

  return (
    <GlassCard className={`p-5 rounded-2xl flex flex-col md:flex-row items-center justify-around gap-6 relative overflow-hidden border border-white/5 ${className}`} glowColor="#8B5CF6">
      
      {/* Target & Silhouette View */}
      <div className="flex flex-col items-center space-y-4">
        {/* Tooltip HUD display box */}
        <div className="h-8 flex items-center justify-center text-center">
          {hovered ? (
            <div className="bg-dark-bg/80 border border-white/10 px-3 py-1 rounded-lg text-[10px] font-black tracking-wide flex items-center gap-1.5 animate-fade-in">
              <span 
                className="w-1.5 h-1.5 rounded-full" 
                style={{ 
                  backgroundColor: hovered.type === 'primary' ? '#22D3EE' : hovered.type === 'secondary' ? '#8B5CF6' : '#60A5FA' 
                }} 
              />
              <span className="text-white capitalize">{hovered.name}</span>
              <span className="text-slate-400">|</span>
              <span className="text-brand-cyan font-bold">{hovered.percentage}% Activation</span>
            </div>
          ) : (
            <span className="text-[10px] text-slate-500 flex items-center gap-1 font-bold">
              <HelpCircle className="w-3.5 h-3.5 text-brand-purple" /> Hover muscles to inspect
            </span>
          )}
        </div>

        {/* Anatomical Silhouette Grid */}
        <div className="w-[130px] h-[220px] shrink-0 relative bg-dark-bg/20 rounded-2xl p-2 border border-white/5 shadow-inner">
          <svg viewBox="0 0 100 210" className="w-full h-full overflow-visible">
            {view === 'front' ? (
              // anterior (front) muscles SVG model
              <>
                {/* Head */}
                <circle cx="50" cy="18" r="9" style={getPartStyle('head')} />
                {/* Neck */}
                <rect x="47" y="27" width="6" height="5" style={getPartStyle('neck')} />
                {/* Shoulders */}
                <path d="M22 36 C24 33, 33 33, 35 36 L32 46 L21 44 Z" style={getPartStyle('front_delts')} onMouseEnter={() => handleMouseEnter('front_delts')} onMouseLeave={handleMouseLeave} />
                <path d="M78 36 C76 33, 67 33, 65 36 L68 46 L79 44 Z" style={getPartStyle('front_delts')} onMouseEnter={() => handleMouseEnter('front_delts')} onMouseLeave={handleMouseLeave} />
                {/* Chest */}
                <path d="M34 38 L66 38 L64 58 L36 58 Z" style={getPartStyle('chest')} onMouseEnter={() => handleMouseEnter('chest')} onMouseLeave={handleMouseLeave} />
                {/* Biceps */}
                <rect x="18" y="47" width="8" height="22" rx="3" style={getPartStyle('biceps')} onMouseEnter={() => handleMouseEnter('biceps')} onMouseLeave={handleMouseLeave} />
                <rect x="74" y="47" width="8" height="22" rx="3" style={getPartStyle('biceps')} onMouseEnter={() => handleMouseEnter('biceps')} onMouseLeave={handleMouseLeave} />
                {/* Forearms */}
                <rect x="15" y="71" width="7" height="24" rx="2" style={getPartStyle('forearms')} onMouseEnter={() => handleMouseEnter('forearms')} onMouseLeave={handleMouseLeave} />
                <rect x="78" y="71" width="7" height="24" rx="2" style={getPartStyle('forearms')} onMouseEnter={() => handleMouseEnter('forearms')} onMouseLeave={handleMouseLeave} />
                {/* Abs / Core */}
                <rect x="36" y="60" width="28" height="34" rx="2" style={getPartStyle('core')} onMouseEnter={() => handleMouseEnter('core')} onMouseLeave={handleMouseLeave} />
                {/* Quadriceps (Front Legs) */}
                <rect x="30" y="98" width="16" height="50" rx="5" style={getPartStyle('quads')} onMouseEnter={() => handleMouseEnter('quads')} onMouseLeave={handleMouseLeave} />
                <rect x="54" y="98" width="16" height="50" rx="5" style={getPartStyle('quads')} onMouseEnter={() => handleMouseEnter('quads')} onMouseLeave={handleMouseLeave} />
                {/* Calves */}
                <rect x="31" y="152" width="12" height="36" rx="3.5" style={getPartStyle('calves')} onMouseEnter={() => handleMouseEnter('calves')} onMouseLeave={handleMouseLeave} />
                <rect x="57" y="152" width="12" height="36" rx="3.5" style={getPartStyle('calves')} onMouseEnter={() => handleMouseEnter('calves')} onMouseLeave={handleMouseLeave} />
              </>
            ) : (
              // posterior (back) muscles SVG model
              <>
                {/* Head */}
                <circle cx="50" cy="18" r="9" style={getPartStyle('head')} />
                {/* Rear Delts */}
                <path d="M22 36 L33 38 L30 46 L21 44 Z" style={getPartStyle('rear_delts')} onMouseEnter={() => handleMouseEnter('rear_delts')} onMouseLeave={handleMouseLeave} />
                <path d="M78 36 L67 38 L70 46 L79 44 Z" style={getPartStyle('rear_delts')} onMouseEnter={() => handleMouseEnter('rear_delts')} onMouseLeave={handleMouseLeave} />
                {/* Traps */}
                <path d="M37 32 L50 24 L63 32 L66 40 L34 40 Z" style={getPartStyle('traps')} onMouseEnter={() => handleMouseEnter('traps')} onMouseLeave={handleMouseLeave} />
                {/* Lats (Upper Back) */}
                <path d="M32 40 L68 40 L63 68 L37 68 Z" style={getPartStyle('lats')} onMouseEnter={() => handleMouseEnter('lats')} onMouseLeave={handleMouseLeave} />
                {/* Lower Back */}
                <rect x="36" y="70" width="28" height="15" rx="1.5" style={getPartStyle('lower_back')} onMouseEnter={() => handleMouseEnter('lower_back')} onMouseLeave={handleMouseLeave} />
                {/* Triceps */}
                <rect x="18" y="47" width="8" height="22" rx="3" style={getPartStyle('triceps')} onMouseEnter={() => handleMouseEnter('triceps')} onMouseLeave={handleMouseLeave} />
                <rect x="74" y="47" width="8" height="22" rx="3" style={getPartStyle('triceps')} onMouseEnter={() => handleMouseEnter('triceps')} onMouseLeave={handleMouseLeave} />
                {/* Forearms */}
                <rect x="15" y="71" width="7" height="24" rx="2" style={getPartStyle('forearms')} onMouseEnter={() => handleMouseEnter('forearms')} onMouseLeave={handleMouseLeave} />
                <rect x="78" y="71" width="7" height="24" rx="2" style={getPartStyle('forearms')} onMouseEnter={() => handleMouseEnter('forearms')} onMouseLeave={handleMouseLeave} />
                {/* Glutes */}
                <path d="M32 87 C32 87, 50 82, 68 87 L65 104 C65 104, 50 108, 35 104 Z" style={getPartStyle('glutes')} onMouseEnter={() => handleMouseEnter('glutes')} onMouseLeave={handleMouseLeave} />
                {/* Hamstrings */}
                <rect x="30" y="108" width="16" height="46" rx="5" style={getPartStyle('hamstrings')} onMouseEnter={() => handleMouseEnter('hamstrings')} onMouseLeave={handleMouseLeave} />
                <rect x="54" y="108" width="16" height="46" rx="5" style={getPartStyle('hamstrings')} onMouseEnter={() => handleMouseEnter('hamstrings')} onMouseLeave={handleMouseLeave} />
                {/* Calves */}
                <rect x="31" y="158" width="12" height="34" rx="3" style={getPartStyle('calves')} onMouseEnter={() => handleMouseEnter('calves')} onMouseLeave={handleMouseLeave} />
                <rect x="57" y="158" width="12" height="34" rx="3" style={getPartStyle('calves')} onMouseEnter={() => handleMouseEnter('calves')} onMouseLeave={handleMouseLeave} />
              </>
            )}
          </svg>
        </div>

        {/* View Toggle Controller */}
        <button
          onClick={() => setView(v => v === 'front' ? 'back' : 'front')}
          className="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-brand-purple/40 text-[10px] font-black uppercase text-slate-300 hover:text-white transition-all shadow-md"
        >
          View: {view === 'front' ? 'Anterior' : 'Posterior'}
        </button>
      </div>

      {/* Legend & Muscle activation loads List */}
      <div className="flex-1 flex flex-col justify-center space-y-4 max-w-[200px] text-xs">
        {/* Primary Load Group */}
        <div>
          <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Primary Target (100%)</span>
          <div className="space-y-1.5 mt-1">
            {primaryList.map(m => (
              <div 
                key={m.name} 
                className="flex justify-between items-center bg-brand-cyan/5 border border-brand-cyan/20 rounded-lg px-2.5 py-1.5 text-white font-bold transition-all hover:bg-brand-cyan/10"
                onMouseEnter={() => setHovered(m)}
                onMouseLeave={handleMouseLeave}
              >
                <span>{m.name}</span>
                <span className="text-brand-cyan text-[10px]">{m.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Secondary Load Group */}
        {secondaryList.length > 0 && (
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Secondary Target (70%)</span>
            <div className="space-y-1.5 mt-1">
              {secondaryList.map(m => (
                <div 
                  key={m.name} 
                  className="flex justify-between items-center bg-brand-purple/5 border border-brand-purple/15 rounded-lg px-2.5 py-1.5 text-white font-bold transition-all hover:bg-brand-purple/10"
                  onMouseEnter={() => setHovered(m)}
                  onMouseLeave={handleMouseLeave}
                >
                  <span>{m.name}</span>
                  <span className="text-brand-purple text-[10px]">{m.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stabilizers Group */}
        {stabilizerList.length > 0 && (
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Stabilizers (40%)</span>
            <div className="flex flex-wrap gap-1 mt-1.5 text-[9px] text-slate-400 font-bold">
              {stabilizerList.map((m, idx) => (
                <span 
                  key={m.name} 
                  className="px-2 py-0.5 rounded bg-white/5 border border-white/5 hover:border-brand-blue/30 cursor-pointer text-slate-400 hover:text-white transition-all"
                  onMouseEnter={() => setHovered(m)}
                  onMouseLeave={handleMouseLeave}
                >
                  {m.name} {m.percentage}%
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

    </GlassCard>
  );
};
