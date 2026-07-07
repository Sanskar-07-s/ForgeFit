// ForgeFit AI - Redirect Wrapper to Muscle Heatmap V2 (v6.0)
import React from 'react';
import { MuscleHeatmap } from '../MuscleHeatmap';

interface Props {
  exercise: any;
  className?: string;
}

export const MuscleActivation: React.FC<Props> = ({ exercise, className = '' }) => {
  return (
    <MuscleHeatmap
      exerciseName={exercise.name}
      className={className}
    />
  );
};
