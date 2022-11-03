import type { Results } from "@mediapipe/pose";
import type { NoteMessageEvent } from "webmidi";
import { state } from "~store/global";
import { floor, map, round } from "~utils/math";
import { PoseLandmark, POSE_LANDMARKS_REVERSE_MAPPER } from "./model";

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

type Note = number;
type Trigger = number;

// Think about playing notes as playing a keyboard:
// You can have many fingers on a single key, so it won't stop until you've removed all of them.

// Notes are sent on different channels, so there should be a relationship between trigger -> channels -> notes
// Therefore, on note on messages (triggers), notes are tied to a channel thats itself tied to a trigger:
interface Triggers {
  [trigger: number | string]: {
    [channel: number | string]: Set<Note>;
  };
}

// Notes can be triggered by different triggers / fingers and are tied to an output channel
// So there should be another relationship channel -> notes -> triggers
// Therefore, on note off messages (triggers), we should try to turn off the notes sounding on those channels:
interface Channels {
  [channel: number | string]: {
    [note: number | string]: Set<Trigger>;
  };
}

interface MidiState {
  channels: Channels;
  poseLandmarks: Results["poseLandmarks"];
  triggers: Triggers;
}
export const midiState: MidiState = {
  channels: {},
  poseLandmarks: [],
  triggers: {},
};

// TODO Config triggers via specific notes in a channel for single channel controllers
export function sendMidiNotes(event: NoteMessageEvent) {
  const output = state.midi.output.selected;
  if (output) {
    const triggerChannel = event.message.channel;
    // We get the triggers from the store
    const triggers = state.triggers[triggerChannel];
    if (triggers) {
      triggers.forEach((landmark) => {
        const {
          triggerChannel,
          outputChannel,
          outputMapper,
          outputMax,
          outputMin,
        } = state.midi.tracking[landmark as PoseLandmark];

        // We get the poses from the landmark
        const pose =
          midiState.poseLandmarks?.[
            POSE_LANDMARKS_REVERSE_MAPPER[landmark as PoseLandmark]
          ];

        if (
          pose &&
          (pose.visibility ?? 0) > 0.5 &&
          outputChannel !== null &&
          outputMapper &&
          triggerChannel !== null
        ) {
          // Build the notes
          const mapped = MIDI_MAPPERS[outputMapper].mapper(
            pose,
            outputMin,
            outputMax
          );
          // For easier handling, every note should go into an array
          const notes = Array.isArray(mapped) ? mapped : [mapped];

          const trigger = (midiState.triggers[triggerChannel] ??= {}); // We add a channels object to the trigger channel if it's undefined
          const notesForChannel = (trigger[outputChannel] ??= new Set<Note>()); // We add a new set of notes to the output channel if it's undefined

          notes.forEach((note) => {
            const channel = (midiState.channels[outputChannel] ??= {});
            const triggersForNote = (channel[note] ??= new Set<Trigger>());
            triggersForNote.add(triggerChannel);

            notesForChannel.add(note);

            output.sendNoteOn(note, {
              channels: outputChannel,
              rawAttack: event.note.rawAttack,
            });
          });
        }
      });
    }
  }
}

export function stopMidiNotes(event: NoteMessageEvent) {
  const output = state.midi.output.selected;
  if (output) {
    const triggerChannel = event.message.channel;
    const channelsForTrigger = midiState.triggers[triggerChannel];
    if (channelsForTrigger) {
      Object.keys(channelsForTrigger).forEach((channel) => {
        const notesForChannel = channelsForTrigger[channel];
        const triggersForNote = midiState.channels[channel];
        if (notesForChannel?.size) {
          notesForChannel.forEach((note) => {
            triggersForNote?.[note]?.delete(triggerChannel);
            if (!triggersForNote?.size) {
              delete triggersForNote?.[note];
              output.sendNoteOff(note, {
                channels: parseInt(channel, 10),
                rawRelease: event.note.rawRelease,
              });
            }
          });
        }
        if (triggersForNote && !Object.keys(triggersForNote).length) {
          delete midiState.channels[channel];
        }
      });
    }
    delete midiState.triggers[triggerChannel];
  }
}
