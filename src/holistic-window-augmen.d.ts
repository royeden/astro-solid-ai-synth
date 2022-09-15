import type { Camera } from "@mediapipe/camera_utils";
import type { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import type {
  FACEMESH_TESSELATION,
  HAND_CONNECTIONS,
  Holistic,
  POSE_CONNECTIONS,
} from "@mediapipe/holistic";

declare global {
  interface Window {
    Holistic: typeof Holistic;
    Camera: typeof Camera;
    drawConnectors: typeof drawConnectors;
    drawLandmarks: typeof drawLandmarks;
    POSE_CONNECTIONS: typeof POSE_CONNECTIONS;
    FACEMESH_TESSELATION: typeof FACEMESH_TESSELATION;
    HAND_CONNECTIONS: typeof HAND_CONNECTIONS;
  }
}
