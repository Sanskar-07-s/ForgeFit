// ForgeFit AI - Pose Estimation Joint Tracking Engine Placeholder (v5.1)

export interface Keypoint {
  part: string;
  position: { x: number; y: number };
  score: number;
}

export const estimatePoseJoints = async (
  videoElement: HTMLVideoElement | null
): Promise<{ keypoints: Keypoint[]; confidence: number; message: string } | null> => {
  if (!videoElement) return null;
  return {
    keypoints: [],
    confidence: 0.0,
    message: 'Camera Coaching Coming Soon',
  };
};
