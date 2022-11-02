// TODO rename file to tracking as it concerns the tracking aspects
import type { Results } from "@mediapipe/pose";
import { DOM_NODE_REFERENCES } from "~store/global";
import { MidiMapper, midiState } from "./midi";

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

export const POSE_LANDMARKS_REVERSE_MAPPER = POSE_LANDMARKS_ORDER.reduce(
  (mapper, landmark, index) => {
    mapper[landmark as PoseLandmark] = index;
    return mapper;
  },
  {} as { [Landmark in PoseLandmark]: number }
);

export const POSE_LANDMARKS_LABELS: {
  [Landmark in PoseLandmark]: string;
} = {
  LEFT_ANKLE: "Left Ankle",
  LEFT_EAR: "Left Ear",
  LEFT_ELBOW: "Left Elbow",
  LEFT_EYE: "Left Eye",
  LEFT_EYE_INNER: "Left Eye (inner)",
  LEFT_EYE_OUTER: "Left Eye (outer)",
  LEFT_FOOT_INDEX: "Left Foot",
  LEFT_HEEL: "Left Heel",
  LEFT_HIP: "Left Hip",
  LEFT_INDEX: "Left Index Finger",
  LEFT_KNEE: "Left Knee",
  LEFT_PINKY: "Left Pinky Finger",
  LEFT_RIGHT: "Left Torso",
  LEFT_SHOULDER: "Left Shoulder",
  LEFT_THUMB: "Left Thumb Finger",
  LEFT_WRIST: "Left Wrist",
  NOSE: "Nose",
  RIGHT_ANKLE: "Right Ankle",
  RIGHT_EAR: "Right Ear",
  RIGHT_ELBOW: "Right Elbow",
  RIGHT_EYE: "Right Eye",
  RIGHT_EYE_INNER: "Right Eye (inner)",
  RIGHT_EYE_OUTER: "Right Eye (outer)",
  RIGHT_FOOT_INDEX: "Right Foot",
  RIGHT_HEEL: "Right Heel",
  RIGHT_HIP: "Right Hip",
  RIGHT_INDEX: "Right Index Finger",
  RIGHT_KNEE: "Right Knee",
  RIGHT_PINKY: "Right Pinky Finger",
  RIGHT_LEFT: "Right Torso",
  RIGHT_SHOULDER: "Right Shoulder",
  RIGHT_THUMB: "Right Thumb Finger",
  RIGHT_WRIST: "Right Wrist",
};

export const POSE_LANDMARKS = POSE_LANDMARKS_ORDER.reduce(
  (landmarks, landmark) => {
    landmarks[landmark] = {
      outputChannel: null,
      outputMapper: null,
      outputMax: 127,
      outputMin: 0,
      triggerChannel: null,
    };
    return landmarks;
  },
  {} as {
    [Landmark in PoseLandmark]: {
      outputChannel: number | null;
      outputMapper: MidiMapper | null;
      outputMax: number;
      outputMin: number;
      triggerChannel: number | null;
    };
  }
);

function drawKeypoints(results: Results) {
  DOM_NODE_REFERENCES.context!.save();
  DOM_NODE_REFERENCES.context!.clearRect(
    0,
    0,
    DOM_NODE_REFERENCES.canvas!.width,
    DOM_NODE_REFERENCES.canvas!.height
  );
  if (results.segmentationMask) {
    DOM_NODE_REFERENCES.context!.drawImage(
      results.segmentationMask,
      0,
      0,
      DOM_NODE_REFERENCES.canvas!.width,
      DOM_NODE_REFERENCES.canvas!.height
    );
  }

  // Only overwrite existing pixels.
  DOM_NODE_REFERENCES.context!.globalCompositeOperation = "source-in";
  DOM_NODE_REFERENCES.context!.fillStyle = "#0000FF";
  DOM_NODE_REFERENCES.context!.fillRect(
    0,
    0,
    DOM_NODE_REFERENCES.canvas!.width,
    DOM_NODE_REFERENCES.canvas!.height
  );

  // Only overwrite missing pixels.
  DOM_NODE_REFERENCES.context!.globalCompositeOperation = "destination-atop";
  DOM_NODE_REFERENCES.context!.drawImage(
    results.image,
    0,
    0,
    DOM_NODE_REFERENCES.canvas!.width,
    DOM_NODE_REFERENCES.canvas!.height
  );

  DOM_NODE_REFERENCES.context!.globalCompositeOperation = "source-over";
  window.drawConnectors(
    DOM_NODE_REFERENCES.context!,
    results.poseLandmarks,
    window.POSE_CONNECTIONS,
    {
      color: "#FFF",
      lineWidth: 1,
    }
  );
  window.drawLandmarks(DOM_NODE_REFERENCES.context!, results.poseLandmarks, {
    color: "#10b981",
    lineWidth: 1,
    radius: 1,
  });
  DOM_NODE_REFERENCES.context!.restore();
}

export function onResults(results: Results) {
  drawKeypoints(results);
  midiState.poseLandmarks = results.poseLandmarks;
}
