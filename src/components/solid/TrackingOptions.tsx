import {
  animateEnter,
  animateExit,
  TransitionGroup,
} from "@otonashixav/solid-flip";
import { createSignal, For } from "solid-js";
import { resetMidiTracking, state, updateMidiTracking } from "~store/global";
import { ALL_MIDI_CHANNELS, MIDI_CHANNELS } from "~utils/midi";
import { PoseLandmark, POSE_LANDMARKS_ORDER } from "~utils/model";
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

export function TrackingOptions() {
  const [collapsedLayout, setCollapsedLayout] = createSignal(false);
  const [filter, setFilter] = createSignal<PoseLandmark | "">("");

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
          onChange={(value) => setFilter(value as PoseLandmark | "")}
          options={[
            { label: "All", value: "" },
            ...POSE_LANDMARKS_ORDER.map((landmark) => ({
              label: landmark,
              value: landmark,
            })),
          ]}
          value={filter()}
        >
          Filter landmark configuration:
        </Select>
      </div>
      <div class="flex w-full justify-center">
        <div
          class="relative"
          classList={{
            "grid gap-4 max-w-md md:max-w-full  md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:max-w-screen-2xl w-full":
              !collapsedLayout(),
            "w-full flex items-center justify-center flex-col":
              collapsedLayout(),
          }}
        >
          <TransitionGroup
            enter={animateEnter(
              {
                keyframes: (el) => [
                  {
                    opacity: 0,
                    ...(collapsedLayout() ? {} : { height: "0px" }),
                  },
                  {
                    opacity: 1,
                    ...(collapsedLayout()
                      ? {}
                      : { height: `${el.clientHeight}px` }),
                  },
                ],
                options: {
                  easing: "cubic-bezier(0, 0, 0.2, 1)",
                },
              },
              { reverseExit: true }
            )}
            exit={animateExit(
              {
                keyframes: [{ opacity: 1 }, { opacity: 0 }],
                options: {
                  easing: "cubic-bezier(0, 0, 0.2, 1)",
                },
              },
              { absolute: true, reverseEnter: true }
            )}
            onEntering={(els) => setCollapsedLayout(els.length === 1)}
            onExited={(els) => {
              if (els.length > 1) setCollapsedLayout(true);
            }}
          >
            <For
              each={
                filter()
                  ? POSE_LANDMARKS_ORDER.filter(
                      (landmark) => landmark === filter()
                    )
                  : POSE_LANDMARKS_ORDER
              }
            >
              {(landmark) => {
                const id = landmark.toLowerCase().replace("_", "-");
                return (
                  <Card class="w-full max-w-md space-y-2 rounded-lg p-2.5">
                    <p class="font-bold">{landmark}</p>
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
