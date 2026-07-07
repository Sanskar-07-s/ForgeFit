// ForgeFit AI - Redirect Wrapper to 3D Studio Coach (v6.0)
import React from 'react';
import { FitnessAvatar3D } from '../FitnessAvatar3D';

interface Props {
  exerciseName: string;
  className?: string;
}

export const ExerciseAvatar: React.FC<Props> = ({ exerciseName, className = '' }) => {
  return (
    <FitnessAvatar3D
      exerciseName={exerciseName}
      mode="workout"
      className={className}
    />
  );
};
