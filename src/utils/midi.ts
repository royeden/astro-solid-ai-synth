import type { Results } from "@mediapipe/pose";
import type { MessageEvent } from "webmidi";
import { state } from "~store/global";
import { map, round } from "~utils/math";
import { PoseLandmark, POSE_LANDMARKS_ORDER } from "./model";

export const MIDI_CHANNELS = Array.from({ length: 16 }, (_, i) => i + 1);
export const ALL_MIDI_CHANNELS = [0, ...MIDI_CHANNELS];

export function toMidiValue(value: number, min: number, max: number) {
  return round(map(value, min, max, 0, 127, true));
}

export function toMidiPitchBend(value: number, min: number, max: number) {
  return map(value, min, max, -1, 1, true);
}

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

// TODO move this to state?
const MAX_DURATION = 10000;

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
        channel
          ? { channels: channel, duration: MAX_DURATION }
          : { duration: MAX_DURATION }
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

export function setupMidiMessages(results: Results) {
  if (results.poseLandmarks?.length) {
    results.poseLandmarks.forEach((landmark, index) => {
      const landmarkConfig =
        state.midi.tracking[POSE_LANDMARKS_ORDER[index] as PoseLandmark]!;
      if (
        landmarkConfig.triggerChannel !== null &&
        landmarkConfig.outputChannel !== null &&
        (landmark.visibility ?? 0) > 0.5
      ) {
        storedState.results[index] = (["x", "y"] as const)
          .map((axis) =>
            landmark[axis] !== undefined && landmarkConfig.outputValues[axis]
              ? toMidiValue(landmark[axis], 0, 1)
              : undefined
          )
          .filter(
            (value) => value !== undefined
          ) as StoredState["results"][number];
      }
    });
  }
}
