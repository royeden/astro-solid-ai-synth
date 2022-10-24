import type { Options } from "@mediapipe/pose";
import { For, Match, Switch } from "solid-js";
import { state, updateModelOptions } from "~store/global";
import { RangeInput } from "./UI";

interface BaseModelOption {
  key: keyof Options;
  name: string;
}

interface RangeModelOption extends BaseModelOption {
  type: "range";
  min: number;
  max: number;
  step: number;
}

interface ToggleModelOption extends BaseModelOption {
  type: "toggle";
}

type ModelOption = RangeModelOption | ToggleModelOption;

export function ModelOptions() {
  return (
    <section class="w-full space-y-2">
      <p class="text-lg font-bold">Model Options</p>
      <div class="space-y-1">
        <For
          each={
            [
              {
                key: "minDetectionConfidence",
                name: "min-detection-confidence",
                max: 0.9,
                min: 0.1,
                step: 0.1,
                type: "range",
              },
              {
                key: "minTrackingConfidence",
                name: "min-tracking-confidence",
                max: 0.9,
                min: 0.1,
                step: 0.1,
                type: "range",
              },
            ] as ModelOption[]
          }
        >
          {(item) => (
            <Switch>
              <Match when={item.type === "range"}>
                <RangeInput
                  containerClass="flex items-center max-w-md justify-between space-x-4 capitalize"
                  max={(item as RangeModelOption).max}
                  min={(item as RangeModelOption).min}
                  name={item.name}
                  onChange={(value) =>
                    updateModelOptions({
                      [item.key]: value,
                    })
                  }
                  step={(item as RangeModelOption).step}
                  value={(state.model.options[item.key] as number) ?? 0}
                >
                  {item.name.split("-").join(" ")}:
                </RangeInput>
              </Match>
              {/* <Match when={item.type === "toggle"}></Match> */}
            </Switch>
          )}
        </For>
      </div>
    </section>
  );
}
