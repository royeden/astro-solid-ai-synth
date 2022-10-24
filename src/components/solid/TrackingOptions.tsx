import {
  animateEnter,
  animateExit,
  TransitionGroup,
} from "@otonashixav/solid-flip";
import { createSignal, For } from "solid-js";
import { resetMidiTracking, state, updateMidiTracking } from "~store/global";
import { ALL_MIDI_CHANNELS, MIDI_CHANNELS } from "~utils/midi";
import { POSE_LANDMARKS_LABELS } from "~utils/model";
import { Button, Card, Checkable, Option, Select } from "./UI";

const TRIGGER_OPTIONS = [
  { label: "None", value: "" },
  ...MIDI_CHANNELS.map(
    (channel) =>
      ({
        label: `Channel ${channel}`,
        value: channel,
      } as Option)
  ),
] as Option[];

const OUTPUT_OPTIONS = [
  { label: "Off", value: "" },
  ...ALL_MIDI_CHANNELS.map(
    (channel) =>
      ({
        label: channel ? `Channel ${channel}` : "Any channel",
        disabled:
          !channel &&
          state.midi.input.selected?.id === state.midi.output.selected?.id,
        value: channel,
      } as Option)
  ),
] as Option[];

const ORDERED_POSE_LANDMARKS = [
  "LEFT_EAR",
  "LEFT_EYE_OUTER",
  "LEFT_EYE",
  "LEFT_EYE_INNER",
  "NOSE",
  "RIGHT_EYE_INNER",
  "RIGHT_EYE",
  "RIGHT_EYE_OUTER",
  "RIGHT_EAR",
  "LEFT_RIGHT",
  "RIGHT_LEFT",
  "LEFT_PINKY",
  "LEFT_INDEX",
  "LEFT_THUMB",
  "LEFT_WRIST",
  "LEFT_SHOULDER",
  "LEFT_ELBOW",
  "RIGHT_PINKY",
  "RIGHT_INDEX",
  "RIGHT_THUMB",
  "RIGHT_WRIST",
  "RIGHT_SHOULDER",
  "RIGHT_ELBOW",
  "LEFT_FOOT_INDEX",
  "LEFT_HEEL",
  "LEFT_ANKLE",
  "LEFT_KNEE",
  "LEFT_HIP",
  "RIGHT_FOOT_INDEX",
  "RIGHT_HEEL",
  "RIGHT_ANKLE",
  "RIGHT_KNEE",
  "RIGHT_HIP",
] as const;

const FILTERS = {
  all: {
    label: "All",
    value: ORDERED_POSE_LANDMARKS.slice(),
  },
  head: {
    label: "Head",
    value: ORDERED_POSE_LANDMARKS.slice(0, 9),
  },
  torso: {
    label: "Torso",
    value: ORDERED_POSE_LANDMARKS.slice(9, 11),
  },
  "left-arm": {
    label: "Left Arm",
    value: ORDERED_POSE_LANDMARKS.slice(11, 17),
  },
  "right-arm": {
    label: "Right Arm",
    value: ORDERED_POSE_LANDMARKS.slice(17, 23),
  },
  "left-leg": {
    label: "Left Leg",
    value: ORDERED_POSE_LANDMARKS.slice(23, 28),
  },
  "right-leg": {
    label: "Right Leg",
    value: ORDERED_POSE_LANDMARKS.slice(28),
  },
} as const;

export function TrackingOptions() {
  const [filter, setFilter] = createSignal<keyof typeof FILTERS>("all");

  return (
    <section class="flex w-full flex-col items-center space-y-4">
      <div class="w-full max-w-lg space-y-2">
        <div class="flex w-full items-center justify-between">
          <p class="text-lg font-bold">Tracking Options</p>
          <Button
            class="min-w-max bg-red-700 enabled:hover:bg-red-600 enabled:focus-visible:bg-red-600"
            custom
            onClick={() => {
              if (
                confirm(
                  "Are you sure you want to reset ALL the tracking configs?"
                )
              ) {
                resetMidiTracking();
              }
            }}
          >
            Reset config
          </Button>
        </div>
        <Select
          containerClass="flex w-full items-center justify-between"
          name="landmarks-filter"
          onChange={(value) => setFilter(value as keyof typeof FILTERS)}
          options={Object.keys(FILTERS).map((value) => ({
            label: FILTERS[value as keyof typeof FILTERS].label,
            value,
          }))}
          value={filter()}
        >
          Filter landmark configuration:
        </Select>
      </div>
      <div class="flex w-full justify-center">
        <div class="relative grid w-full max-w-md gap-4 md:max-w-full md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:max-w-screen-2xl">
          <TransitionGroup
            enter={animateEnter(
              {
                keyframes: (el) => [
                  {
                    opacity: 0,
                    height: "0px",
                    overflow: "hidden",
                  },
                  {
                    opacity: 1,
                    height: `${el.clientHeight}px`,
                    overflow: "hidden",
                  },
                  {
                    opacity: 1,
                    height: `${el.clientHeight}px`,
                  },
                ],
                options: {
                  easing: "cubic-bezier(0, 0, 0.2, 1)",
                  duration: 500,
                },
              },
              { reverseExit: true }
            )}
            exit={animateExit(
              {
                keyframes: (el) => [
                  {
                    opacity: 1,
                    height: `${el.clientHeight}px`,
                    overflow: "hidden",
                  },
                  {
                    opacity: 0,
                    height: "0px",
                    overflow: "hidden",
                  },
                ],
                options: {
                  easing: "cubic-bezier(0, 0, 0.2, 1)",
                  duration: 500,
                },
              },
              { absolute: true, reverseEnter: true }
            )}
          >
            <For each={FILTERS[filter()].value}>
              {(landmark) => {
                const id = landmark.toLowerCase().replace("_", "-");
                return (
                  <Card class="w-full max-w-md space-y-2 rounded-lg p-2.5">
                    <p class="font-bold">{POSE_LANDMARKS_LABELS[landmark]}</p>
                    <div class="flex w-full flex-col justify-between space-y-2">
                      <Select
                        containerClass="space-x-2"
                        name={`trigger-channel-${id}`}
                        options={TRIGGER_OPTIONS}
                        onChange={(value) =>
                          updateMidiTracking(landmark, {
                            triggerChannel:
                              value === "" ? null : parseInt(value, 10),
                          })
                        }
                        value={
                          state.midi.tracking[landmark].triggerChannel ?? ""
                        }
                      >
                        Trigger channel:
                      </Select>
                      <Select
                        containerClass="space-x-2"
                        name={`output-channel-${id}`}
                        options={OUTPUT_OPTIONS}
                        onChange={(value) =>
                          updateMidiTracking(landmark, {
                            outputChannel:
                              value === "" ? null : parseInt(value, 10),
                          })
                        }
                        value={
                          state.midi.tracking[landmark].outputChannel ?? ""
                        }
                      >
                        Output channel:
                      </Select>
                    </div>
                    <div class="flex w-full flex-wrap items-center space-x-2">
                      <For each={["x", "y"] as const}>
                        {(axis) => (
                          <Checkable
                            checked={
                              state.midi.tracking[landmark].outputValues[axis]
                            }
                            containerClass="flex items-center space-x-2"
                            name={`channel-${id}-${axis}`}
                            onChange={(checked) =>
                              updateMidiTracking(landmark, {
                                outputValues: {
                                  ...state.midi.tracking[landmark].outputValues,
                                  [axis]: checked,
                                },
                              })
                            }
                            type="checkbox"
                          >
                            Send {axis}:
                          </Checkable>
                        )}
                      </For>
                    </div>
                  </Card>
                );
              }}
            </For>
          </TransitionGroup>
        </div>
      </div>
    </section>
  );
}
