import type { Pose, Options } from "@mediapipe/pose";
import { createStore } from "solid-js/store";
import { Input, Output, WebMidi } from "webmidi";
import { debounce } from "~utils/debounce";
import { sendMidiMessages, stopMidiMessages } from "~utils/midi";
import {
  onResults,
  PoseLandmark,
  POSE_LANDMARKS,
  POSE_LANDMARKS_ORDER,
} from "~utils/model";
import { version } from "package.json";
import { IS_IN_CLIENT } from "~constants/env";
import { Camera, Dimensions } from "~utils/camera";

export type TrackingConfig = typeof POSE_LANDMARKS;

interface Instances {
  camera?: Camera; // TODO remove and implement our own camera implementation, the mediapipe won't allow re building a Camera instance, it stays in memory
  model?: Pose;
}

interface DomRefs {
  canvas?: HTMLCanvasElement;
  context?: CanvasRenderingContext2D;
  video?: HTMLVideoElement;
}

interface MidiDeviceConfig<T> {
  available: T[];
  selected: T | undefined;
}

export interface GlobalStore {
  camera: {
    active: boolean;
    deviceId: string;
    dimensions: Dimensions;
    loading: boolean;
  };
  midi: {
    active: boolean;
    input: MidiDeviceConfig<Input>;
    output: MidiDeviceConfig<Output>;
    tracking: TrackingConfig;
  };
  model: {
    // colors: {};
    loading: boolean;
    options: Options;
  };
}

export interface StoredConfig {
  camera: {
    deviceId: string;
    dimensions: Dimensions;
  };
  model: {
    options: Options;
  };
  tracking: TrackingConfig;
}

export const instances: Instances = {};
export const DOM_NODE_REFERENCES: DomRefs = {};

function getInitialTrackingConfig() {
  return POSE_LANDMARKS_ORDER.reduce((tracking, landmark) => {
    tracking[landmark as PoseLandmark] = Object.assign(
      {},
      POSE_LANDMARKS[landmark as PoseLandmark]
    );
    return tracking;
  }, {} as TrackingConfig);
}

export const [state, setState] = createStore<GlobalStore>({
  camera: {
    active: false,
    deviceId: "",
    dimensions: {
      height: 360,
      width: 640,
    },
    loading: true,
  },
  midi: {
    active: false,
    input: {
      available: [],
      selected: undefined,
    },
    output: {
      available: [],
      selected: undefined,
    },
    tracking: getInitialTrackingConfig(),
  },
  model: {
    loading: true,
    options: {
      // enableFaceGeometry: false,
      selfieMode: false,
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      smoothSegmentation: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    },
  },
});

const STORED_CONFIG_KEY = "StoredConfig_" + version;

export function getStoredConfig(): StoredConfig {
  const fallback = {
    camera: {
      deviceId: state.camera.deviceId,
      dimensions: state.camera.dimensions,
    },
    model: {
      options: state.model.options,
    },
    tracking: state.midi.tracking,
  } as StoredConfig;

  if (IS_IN_CLIENT) {
    const config = localStorage.getItem(STORED_CONFIG_KEY);
    if (config) {
      return JSON.parse(config) as StoredConfig;
    } else {
      localStorage.setItem(STORED_CONFIG_KEY, JSON.stringify(fallback));
    }
  }

  return fallback;
}

export function setStoredConfig(config: Partial<StoredConfig>) {
  if (IS_IN_CLIENT) {
    localStorage.setItem(
      STORED_CONFIG_KEY,
      JSON.stringify({
        ...getStoredConfig(),
        ...config,
      })
    );
  }
}

export function setupStoredConfig(config: StoredConfig) {
  setState({
    camera: {
      ...state.camera,
      ...config.camera,
    },
    midi: {
      ...state.midi,
      tracking: config.tracking,
    },
    model: {
      ...state.model,
      ...config.model,
    },
  });
}

export function setupCanvasContext() {
  DOM_NODE_REFERENCES.context = DOM_NODE_REFERENCES.canvas!.getContext("2d")!;
}

export async function setupCamera() {
  if (instances.camera) {
    await instances.camera.update({
      deviceId: state.camera.deviceId,
      ...state.camera.dimensions,
    });
  } else {
    setState("camera", "active", false);
    instances.camera = new Camera(DOM_NODE_REFERENCES.video!, {
      deviceId: state.camera.deviceId,
      onFrame: async () => {
        if (!DOM_NODE_REFERENCES.video!.paused) {
          await instances.model?.send({ image: DOM_NODE_REFERENCES.video! });
        }
      },
      height: state.camera.dimensions.height,
      width: state.camera.dimensions.width,
    });
    await instances.camera.start();
    setState("camera", "active", true);
  }
}

export function updateCamera(
  camera: Partial<Omit<GlobalStore["camera"], "loading">>
) {
  if (camera.active !== undefined && state.camera.active !== camera.active) {
    if (camera.active) {
      instances.camera?.start();
    } else {
      instances.camera?.stop();
    }
  }

  if (
    (camera.dimensions !== undefined &&
      (camera.dimensions.height !== state.camera.dimensions.height ||
        camera.dimensions.width !== state.camera.dimensions.width)) ||
    (camera.deviceId !== undefined && camera.deviceId !== state.camera.deviceId)
  ) {
    setupCamera();
  }

  setState("camera", camera);
  setStoredConfig({
    camera: {
      deviceId: state.camera.deviceId,
      dimensions: state.camera.dimensions,
    },
  });
}

export async function setupModel() {
  instances.model = new window.Pose({
    locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
    },
  });

  instances.model.setOptions(state.model.options);
  instances.model.onResults(onResults);
  await instances.model.initialize();
  await setupCamera();
  setState("model", "loading", false);
}

function setModelOptions(options: Options) {
  instances.model!.setOptions(options);
  instances.model!.reset();
  setState("model", "loading", false);
}

const debouncedSetModelOptions = debounce(setModelOptions, 750);

// TODO error check if no instance is found
export function updateModelOptions(options: Partial<Options>) {
  setState("model", {
    loading: state.camera.active,
    options: { ...state.model.options, ...options },
  });
  setStoredConfig({
    model: {
      options: state.model.options,
    },
  });
  if (state.camera.active) {
    debouncedSetModelOptions(state.model.options);
  } else {
    setModelOptions(state.model.options);
  }
}

// TODO check error if no midi device is found
export async function setupMidi() {
  if (WebMidi.enabled) {
    console.log("WebMidi restarting...");
    setState("midi", "active", false);
    await WebMidi.disable();
  }
  await WebMidi.enable();
  console.log("WebMidi enabled!");
  const { inputs, outputs } = WebMidi;
  setState("midi", {
    ...state.midi,
    active: true,
    input: {
      available: inputs,
      selected: undefined,
    },
    output: {
      available: outputs,
      selected: outputs?.[0],
    },
    tracking: POSE_LANDMARKS_ORDER.reduce((tracking, landmark) => {
      if (tracking[landmark as PoseLandmark].outputChannel === 0) {
        tracking[landmark as PoseLandmark].outputChannel = null;
      }
      return tracking;
    }, state.midi.tracking),
  });
  if (inputs[0]) updateMidiInput(inputs[0]);
}

export function updateMidiInput(input: Input) {
  state.midi.input.selected?.removeListener("noteon", sendMidiMessages);
  state.midi.input.selected?.removeListener("noteoff", stopMidiMessages);
  input.addListener("noteon", sendMidiMessages);
  input.addListener("noteoff", stopMidiMessages);
  setState("midi", "input", "selected", input);
}

export function updateMidiTracking(
  landmark: PoseLandmark,
  landmarkConfig: Partial<GlobalStore["midi"]["tracking"][PoseLandmark]>
) {
  if (state.midi.output.selected) {
    const prevOutputChannel = state.midi.tracking[landmark].outputChannel!;
    if (
      landmarkConfig.outputChannel !== prevOutputChannel ||
      landmarkConfig.triggerChannel === null
    ) {
      state.midi.output.selected.sendAllNotesOff(
        prevOutputChannel ? { channels: prevOutputChannel } : undefined
      );
    }
  }
  setState("midi", "tracking", landmark, {
    ...state.midi.tracking[landmark],
    ...landmarkConfig,
  });

  setStoredConfig({ tracking: state.midi.tracking });
}

export function resetMidiTracking() {
  POSE_LANDMARKS_ORDER.forEach((landmark) =>
    updateMidiTracking(
      landmark as PoseLandmark,
      Object.assign({}, POSE_LANDMARKS[landmark as PoseLandmark])
    )
  );
}
