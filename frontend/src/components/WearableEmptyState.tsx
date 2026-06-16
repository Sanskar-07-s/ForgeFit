// ForgeFit AI - Wearable Empty State Placeholder (v5.1)

import React from 'react';
import { Lock, Smartphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from './GlassCard';
import { MotionButton } from './MotionButton';

interface Props {
  metricName: string;
  icon?: React.ReactNode;
  className?: string;
}

export const WearableEmptyState: React.FC<Props> = ({
  metricName,
  icon = '🔋',
  className = '',
}) => {
  const navigate = useNavigate();

  return (
    <GlassCard
      className={`p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 border border-white/5 relative min-h-[160px] overflow-hidden ${className}`}
      glowColor="#EF4444"
    >
      <div className="absolute top-3 right-3 text-slate-700">
        <Lock className="w-3.5 h-3.5" />
      </div>

      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-2xl animate-pulse">
        {icon}
      </div>

      <div className="space-y-1">
        <h4 className="font-extrabold text-white text-xs">{metricName} Unavailable</h4>
        <p className="text-[10px] text-slate-500 max-w-[200px] leading-relaxed mx-auto">
          Connect a wearable device or log this metric manually to unlock insights.
        </p>
      </div>

      <MotionButton
        onClick={() => navigate('/devices')}
        variant="secondary"
        size="sm"
        className="text-[10px] py-1 px-3 border-white/10 hover:border-brand-cyan/40"
      >
        <Smartphone className="w-3 h-3" /> Connect Device
      </MotionButton>
    </GlassCard>
  );
};
