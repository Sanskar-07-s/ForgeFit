// ForgeFit AI - Muscle Activation System (v5.0)

import React from 'react';
import { Exercise } from '@shared/types';
import { GlassCard } from '../GlassCard';
import { Sparkles } from 'lucide-react';

interface Props {
  exercise: Exercise;
  className?: string;
}

// Map muscle names to matching anatomical paths/ids
const mapToBodyPartId = (name: string): string => {
  const n = name.toLowerCase();
  if (n.includes('chest') || n.includes('pectoral')) return 'chest';
  if (n.includes('back') || n.includes('lat') || n.includes('traps') || n.includes('rhomboid')) return 'back';
  if (n.includes('shoulder') || n.includes('delt')) return 'shoulders';
  if (n.includes('bicep')) return 'biceps';
  if (n.includes('tricep')) return 'triceps';
  if (n.includes('core') || n.includes('abs') || n.includes('abdominal') || n.includes('oblique')) return 'core';
  if (n.includes('leg') || n.includes('quad') || n.includes('thigh') || n.includes('hamstring') || n.includes('press')) return 'legs';
  if (n.includes('glute')) return 'glutes';
  if (n.includes('calf') || n.includes('calves')) return 'calves';
  if (n.includes('forearm')) return 'forearms';
  return 'core'; // fallback
};

export const MuscleActivation: React.FC<Props> = ({ exercise, className = '' }) => {
  const primaryName = exercise.muscle_group;
  const secondaryNames = exercise.secondary_muscles || [];

  // Inferred stabilizers based on primary muscle group
  const getInferredStabilizers = (primary: string): string[] => {
    const p = primary.toLowerCase();
    if (p.includes('chest')) return ['Core', 'Shoulders'];
    if (p.includes('back')) return ['Core', 'Biceps'];
    if (p.includes('leg') || p.includes('quad') || p.includes('hamstring')) return ['Core', 'Lower Back'];
    if (p.includes('shoulder')) return ['Core', 'Triceps'];
    return ['Core'];
  };

  const stabilizerNames = getInferredStabilizers(primaryName);

  // Map to anatomy IDs
  const primaryId = mapToBodyPartId(primaryName);
  const secondaryIds = secondaryNames.map(mapToBodyPartId);
  const stabilizerIds = stabilizerNames.map(mapToBodyPartId);

  // Helper to color each part
  const getPartColor = (partId: string) => {
    if (partId === primaryId) return '#EF4444'; // Bright Red (Primary)
    if (secondaryIds.includes(partId)) return '#F97316'; // Orange (Secondary)
    if (stabilizerIds.includes(partId)) return '#F59E0B'; // Yellow (Stabilizer)
    return 'rgba(255, 255, 255, 0.1)'; // Muted / Inactive
  };

  const getPartGlow = (partId: string) => {
    if (partId === primaryId) return 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.8))';
    if (secondaryIds.includes(partId)) return 'drop-shadow(0 0 6px rgba(249, 115, 22, 0.6))';
    if (stabilizerIds.includes(partId)) return 'drop-shadow(0 0 4px rgba(245, 158, 11, 0.5))';
    return 'none';
  };

  return (
    <GlassCard className={`p-5 rounded-2xl flex flex-col items-center relative overflow-hidden ${className}`} glowColor="#EF4444">
      <div className="w-full flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Muscle Activation Map</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Real-time load activation model</p>
        </div>
        <Sparkles className="w-4 h-4 text-brand-cyan" />
      </div>

      <div className="flex w-full items-center justify-around gap-6">
        {/* Stylized Human Muscle Silhouette SVG */}
        <div className="w-[140px] h-[220px]">
          <svg viewBox="0 0 100 200" className="w-full h-full overflow-visible">
            {/* Head */}
            <circle cx="50" cy="18" r="10" fill={getPartColor('head')} style={{ filter: getPartGlow('head'), transition: 'fill 0.4s ease' }} />

            {/* Neck */}
            <rect x="47" y="27" width="6" height="6" fill="rgba(255,255,255,0.1)" />

            {/* Shoulders */}
            <path d="M26 36 C28 32, 72 32, 74 36 L78 44 L72 46 L68 38 L32 38 L28 46 L22 44 Z" fill={getPartColor('shoulders')} style={{ filter: getPartGlow('shoulders'), transition: 'fill 0.4s ease' }} />

            {/* Chest */}
            <path d="M32 40 L68 40 L66 62 L34 62 Z" fill={getPartColor('chest')} style={{ filter: getPartGlow('chest'), transition: 'fill 0.4s ease' }} />

            {/* Biceps (Left & Right upper arm) */}
            <rect x="19" y="44" width="8" height="20" rx="3" fill={getPartColor('biceps')} style={{ filter: getPartGlow('biceps'), transition: 'fill 0.4s ease' }} />
            <rect x="73" y="44" width="8" height="20" rx="3" fill={getPartColor('biceps')} style={{ filter: getPartGlow('biceps'), transition: 'fill 0.4s ease' }} />

            {/* Forearms */}
            <rect x="17" y="66" width="7" height="22" rx="2" fill={getPartColor('forearms')} style={{ filter: getPartGlow('forearms'), transition: 'fill 0.4s ease' }} />
            <rect x="76" y="66" width="7" height="22" rx="2" fill={getPartColor('forearms')} style={{ filter: getPartGlow('forearms'), transition: 'fill 0.4s ease' }} />

            {/* Abs / Core */}
            <rect x="36" y="65" width="28" height="28" rx="2" fill={getPartColor('core')} style={{ filter: getPartGlow('core'), transition: 'fill 0.4s ease' }} />

            {/* Hips / Glutes */}
            <path d="M34 94 L66 94 L62 108 L38 108 Z" fill={getPartColor('glutes')} style={{ filter: getPartGlow('glutes'), transition: 'fill 0.4s ease' }} />

            {/* Legs / Quads */}
            <rect x="31" y="110" width="15" height="36" rx="4" fill={getPartColor('legs')} style={{ filter: getPartGlow('legs'), transition: 'fill 0.4s ease' }} />
            <rect x="54" y="110" width="15" height="36" rx="4" fill={getPartColor('legs')} style={{ filter: getPartGlow('legs'), transition: 'fill 0.4s ease' }} />

            {/* Calves */}
            <rect x="32" y="148" width="11" height="30" rx="3" fill={getPartColor('calves')} style={{ filter: getPartGlow('calves'), transition: 'fill 0.4s ease' }} />
            <rect x="57" y="148" width="11" height="30" rx="3" fill={getPartColor('calves')} style={{ filter: getPartGlow('calves'), transition: 'fill 0.4s ease' }} />
          </svg>
        </div>

        {/* Dynamic color-coded legend detailing which muscles fall under which category */}
        <div className="flex flex-col gap-3 text-xs w-[140px]">
          <div className="space-y-1">
            <span className="text-[9px] uppercase font-bold text-slate-500">Primary Group</span>
            <div className="flex items-center gap-1.5 font-bold text-white">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#EF4444', boxShadow: '0 0 6px #EF4444' }} />
              <span className="truncate">{primaryName}</span>
            </div>
          </div>

          {secondaryNames.length > 0 && (
            <div className="space-y-1">
              <span className="text-[9px] uppercase font-bold text-slate-500">Secondary Loader</span>
              <div className="flex flex-col gap-1 text-slate-300 font-medium">
                {secondaryNames.map((n) => (
                  <div key={n} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#F97316' }} />
                    <span className="truncate">{n}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1">
            <span className="text-[9px] uppercase font-bold text-slate-500">Stabilizers</span>
            <div className="flex flex-col gap-1 text-slate-300 font-medium">
              {stabilizerNames.map((n) => (
                <div key={n} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#F59E0B' }} />
                  <span className="truncate">{n}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};
