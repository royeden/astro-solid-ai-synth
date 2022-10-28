import type { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import type { Pose, POSE_CONNECTIONS } from "@mediapipe/pose";

declare global {
  interface Window {
    Pose: typeof Pose;
    drawConnectors: typeof drawConnectors;
    drawLandmarks: typeof drawLandmarks;
    POSE_CONNECTIONS: typeof POSE_CONNECTIONS;
  }
}
