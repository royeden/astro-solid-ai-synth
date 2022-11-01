import type { Results } from "@mediapipe/pose";
import type { MessageEvent } from "webmidi";
import { state } from "~store/global";
import { floor, map, round } from "~utils/math";
import { PoseLandmark, POSE_LANDMARKS_ORDER } from "./model";

export const MIDI_CHANNELS = Array.from({ length: 16 }, (_, i) => i + 1);
export const ALL_MIDI_CHANNELS = [0, ...MIDI_CHANNELS];

interface Point {
  x: number;
  y: number;
}

type Mapper = (point: Point, min: number, max: number) => number;

const MAX_TRACKING_RANGE = {
  x: 1,
  y: 1,
};

export const NOTE_LABELS = [
  "C",
  "C#/Db",
  "D",
  "D#/Eb",
  "E",
  "F",
  "F#/Gb",
  "G",
  "G#/Ab",
  "A",
  "A#/Bb",
  "B",
];

// We use a 12 note scale because of MIDI
export function octave(note: number) {
  return floor(note / 12);
}

function axisMapper(axis: keyof Point, invert = false): Mapper {
  return function midiMapper(point: Point, min = 0, max = 127) {
    const value = point[axis];
    const maxValue = MAX_TRACKING_RANGE[axis];
    return round(
      map(
        // X axis is flipped
        (invert && axis === "y") || (axis === "x" && !invert)
          ? maxValue - value
          : value,
        0,
        maxValue,
        min,
        max,
        true
      )
    );
  };
}

function linearMapper(
  invert: { x?: boolean; y?: boolean } = { x: false, y: false }
): Mapper {
  return function midiMapper(point: Point, min = 0, max = 127) {
    const { x, y } = point;
    const { x: xMax, y: yMax } = MAX_TRACKING_RANGE;
    const { x: xInvert, y: yInvert } = invert;
    const xValue = xInvert ? x : xMax - x; // X axis is flipped
    const yValue = yInvert ? yMax - y : y;
    return round(map(xValue + yValue, 0, xMax + yMax, min, max, true));
  };
}

export const MIDI_MAPPERS = {
  x: {
    label: "X: min ➡️ max",
    mapper: axisMapper("x"),
  },
  x_inverted: {
    label: "X: min ⬅️ max",
    mapper: axisMapper("x", true),
  },
  y: {
    label: "Y: min ⬇️ max",
    mapper: axisMapper("y"),
  },
  y_inverted: {
    label: "Y: min ⬆️ max",
    mapper: axisMapper("y", true),
  },
  x_y: {
    label: "XY 0 ↘ 127",
    mapper: linearMapper(),
  },
  x_inverted_y: {
    label: "XY 0 ↙ 127",
    mapper: linearMapper({ x: true }),
  },
  x_y_inverted: {
    label: "XY 0 ↗ 127",
    mapper: linearMapper({ y: true }),
  },
  x_inverted_y_inverted: {
    label: "XY 0 ↖ 127",
    mapper: linearMapper({ x: true, y: true }),
  },
  x_y_double: {
    label: "X: min ➡️ max, Y: min ⬇️ max",
    mapper: (...args: Parameters<Mapper>) =>
      [MIDI_MAPPERS.x.mapper(...args), MIDI_MAPPERS.y.mapper(...args)] as [
        number,
        number
      ],
  },
  x_inverted_y_double: {
    label: "X: min ⬅️ max, Y: min ⬇️ max",
    mapper: (...args: Parameters<Mapper>) =>
      [
        MIDI_MAPPERS.x_inverted.mapper(...args),
        MIDI_MAPPERS.y.mapper(...args),
      ] as [number, number],
  },
  x_y_inverted_double: {
    label: "X: min ➡️ max, Y: min ⬆️ max",
    mapper: (...args: Parameters<Mapper>) =>
      [
        MIDI_MAPPERS.x.mapper(...args),
        MIDI_MAPPERS.y_inverted.mapper(...args),
      ] as [number, number],
  },
  x_inverted_y_inverted_double: {
    label: "X: min ⬅️ max, Y: min ⬆️ max",
    mapper: (...args: Parameters<Mapper>) =>
      [
        MIDI_MAPPERS.x_inverted.mapper(...args),
        MIDI_MAPPERS.y_inverted.mapper(...args),
      ] as [number, number],
  },
} as const;

export type MidiMapper = keyof typeof MIDI_MAPPERS;

export interface StoredState {
  notes: Array<undefined | number[]>;
  results: Array<[number, number] | [number] | []>;
  triggers: boolean[];
}

const storedState: StoredState = {
  notes: ALL_MIDI_CHANNELS.map(() => undefined),
  results: POSE_LANDMARKS_ORDER.map(() => []),
  triggers: MIDI_CHANNELS.map(() => false),
};

// TODO consider not using sets so we already have arrays
function getChannelNotesByTrigger(trigger: number) {
  return POSE_LANDMARKS_ORDER.reduce((notesByChannel, landmark, index) => {
    const landmarkConfig = state.midi.tracking[landmark];
    if (
      storedState.results[index] &&
      landmarkConfig.outputChannel !== undefined &&
      landmarkConfig.triggerChannel === trigger
    ) {
      const notes = storedState.results[index]!;
      const channel = landmarkConfig.outputChannel!.toString();
      if (notesByChannel[channel]) {
        if (notes[0]) notesByChannel[channel]!.add(notes[0]);
        if (notes[1]) notesByChannel[channel]!.add(notes[1]);
      } else {
        notesByChannel[channel] = new Set(notes);
      }
    }
    return notesByChannel;
  }, {} as { [key: string]: Set<number> });
}

export function sendMidiMessages(event: MessageEvent) {
  if (state.midi.output.selected) {
    const notesToPlay = getChannelNotesByTrigger(event.message.channel);
    const channelsToPlay = Object.keys(notesToPlay);

    channelsToPlay.forEach((channelKey) => {
      const channel = parseInt(channelKey, 10);
      const notes = Array.from(notesToPlay[channel]!);

      storedState.notes[channel] = notes;

      state.midi.output.selected!.playNote(
        notes,
        channel ? { channels: channel } : {}
      );
    });

    if (channelsToPlay.length) {
      storedState.triggers[event.message.channel] = true;
    }
  }
}

// TODO revise this
export function stopMidiMessages(event: MessageEvent) {
  if (
    state.midi.output.selected &&
    storedState.triggers[event.message.channel]
  ) {
    const updatedNotes = getChannelNotesByTrigger(event.message.channel);

    storedState.notes.forEach((notes, channel) => {
      if (notes) {
        const notesStatus = notes.reduce(
          (status, note) => {
            if (updatedNotes[channel]?.has(note)) {
              status.on.push(note);
            } else {
              status.off.push(note);
            }
            return status;
          },
          { off: [] as number[], on: [] as number[] }
        );

        storedState.notes[channel] = notesStatus.on;

        state.midi.output.selected!.sendNoteOff(
          notesStatus.off,
          channel ? { channels: channel } : undefined
        );
      }
    });
    storedState.triggers[event.message.channel] = false;
  }
}

// function quantize(inputNote: number, scale: number[], roundUp = false) {
//   const noteInScale = inputNote % 12;

//   return scale.includes(noteInScale)
//     ? inputNote
//     : octave(inputNote) * 12 +
//         scale.reduce(
//           (pick, note) =>
//             Math.abs(noteInScale - note) <
//             Math.abs(noteInScale - pick) + (roundUp ? 1 : 0)
//               ? note
//               : pick,
//           12
//         );
// }

// TODO consider creating the values before sending them instead of frame by frame
export function setupMidiMessages(results: Results) {
  if (results.poseLandmarks?.length) {
    results.poseLandmarks.forEach((landmark, index) => {
      const landmarkConfig =
        state.midi.tracking[POSE_LANDMARKS_ORDER[index] as PoseLandmark]!;
      if (
        landmarkConfig.triggerChannel !== null &&
        landmarkConfig.outputChannel !== null &&
        landmarkConfig.outputMapper &&
        (landmark.visibility ?? 0) >
          (state.model.options.minTrackingConfidence ?? 0.5)
      ) {
        const value = MIDI_MAPPERS[landmarkConfig.outputMapper].mapper(
          landmark,
          landmarkConfig.outputMin,
          landmarkConfig.outputMax
        );

        storedState.results[index] = (
          Array.isArray(value) ? value : [value]
        ) as StoredState["results"][number];
      }
    });
  }
}
