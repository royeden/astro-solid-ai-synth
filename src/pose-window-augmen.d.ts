import type { Camera } from "@mediapipe/camera_utils";
import type { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import type {
  Pose,
  POSE_CONNECTIONS,
} from "@mediapipe/pose";

declare global {
  interface Window {
    Pose: typeof Pose;
    Camera: typeof Camera;
    drawConnectors: typeof drawConnectors;
    drawLandmarks: typeof drawLandmarks;
    POSE_CONNECTIONS: typeof POSE_CONNECTIONS;
  }
}
