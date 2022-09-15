import type { Results } from "@mediapipe/holistic";
import { nodeReferences } from "~store/global";
import { setupMidiMessages } from "./midi";

export const POSE_LANDMARKS_ORDER = [
  "NOSE",
  "LEFT_EYE_INNER",
  "LEFT_EYE",
  "LEFT_EYE_OUTER",
  "RIGHT_EYE_INNER",
  "RIGHT_EYE",
  "RIGHT_EYE_OUTER",
  "LEFT_EAR",
  "RIGHT_EAR",
  "LEFT_RIGHT",
  "RIGHT_LEFT",
  "LEFT_SHOULDER",
  "RIGHT_SHOULDER",
  "LEFT_ELBOW",
  "RIGHT_ELBOW",
  "LEFT_WRIST",
  "RIGHT_WRIST",
  "LEFT_PINKY",
  "RIGHT_PINKY",
  "LEFT_INDEX",
  "RIGHT_INDEX",
  "LEFT_THUMB",
  "RIGHT_THUMB",
  "LEFT_HIP",
  "RIGHT_HIP",
  "LEFT_KNEE",
  "RIGHT_KNEE",
  "LEFT_ANKLE",
  "RIGHT_ANKLE",
  "LEFT_HEEL",
  "RIGHT_HEEL",
  "LEFT_FOOT_INDEX",
  "RIGHT_FOOT_INDEX",
] as const;

export type PoseLandmark = typeof POSE_LANDMARKS_ORDER[number];

export const POSE_LANDMARKS = POSE_LANDMARKS_ORDER.reduce(
  (landmarks, landmark) => {
    landmarks[landmark] = {
      outputChannel: null,
      outputValues: {
        x: true,
        y: true,
      },
      triggerChannel: null,
    };
    return landmarks;
  },
  {} as {
    [Landmark in PoseLandmark]: {
      outputChannel: number | null;
      outputValues: {
        x: boolean;
        y: boolean;
      };
      triggerChannel: number | null;
    };
  }
);

function drawKeypoints(results: Results) {
  nodeReferences.context!.save();
  nodeReferences.context!.clearRect(
    0,
    0,
    nodeReferences.canvas!.width,
    nodeReferences.canvas!.height
  );
  if (results.segmentationMask) {
    nodeReferences.context!.drawImage(
      results.segmentationMask,
      0,
      0,
      nodeReferences.canvas!.width,
      nodeReferences.canvas!.height
    );
  }

  // Only overwrite existing pixels.
  nodeReferences.context!.globalCompositeOperation = "source-in";
  nodeReferences.context!.fillStyle = "#0000FF";
  nodeReferences.context!.fillRect(
    0,
    0,
    nodeReferences.canvas!.width,
    nodeReferences.canvas!.height
  );

  // Only overwrite missing pixels.
  nodeReferences.context!.globalCompositeOperation = "destination-atop";
  nodeReferences.context!.drawImage(
    results.image,
    0,
    0,
    nodeReferences.canvas!.width,
    nodeReferences.canvas!.height
  );

  nodeReferences.context!.globalCompositeOperation = "source-over";
  window.drawConnectors(
    nodeReferences.context!,
    results.poseLandmarks,
    window.POSE_CONNECTIONS,
    {
      color: "#FFF",
      lineWidth: 1,
    }
  );
  window.drawLandmarks(nodeReferences.context!, results.poseLandmarks, {
    color: "#10b981",
    lineWidth: 1,
    radius: 1,
  });
  window.drawConnectors(
    nodeReferences.context!,
    results.faceLandmarks,
    window.FACEMESH_TESSELATION,
    {
      color: "#0ea5e910",
      lineWidth: 1,
    }
  );
  window.drawConnectors(
    nodeReferences.context!,
    results.leftHandLandmarks,
    window.HAND_CONNECTIONS,
    {
      color: "#a855f7",
      lineWidth: 1,
    }
  );
  window.drawLandmarks(nodeReferences.context!, results.leftHandLandmarks, {
    color: "#eab308",
    lineWidth: 1,
    radius: 1,
  });
  window.drawConnectors(
    nodeReferences.context!,
    results.rightHandLandmarks,
    window.HAND_CONNECTIONS,
    {
      color: "#f43f5e",
      lineWidth: 1,
    }
  );
  window.drawLandmarks(nodeReferences.context!, results.rightHandLandmarks, {
    color: "#3b82f6",
    lineWidth: 1,
    radius: 1,
  });
  nodeReferences.context!.restore();
}

export function onResults(results: Results) {
  drawKeypoints(results);
  setupMidiMessages(results);
}
