import type { Options } from "@mediapipe/pose";
import { For, Match, Switch } from "solid-js";
import { state, updateModelOptions } from "~store/global";
import { Option, RangeInput, Select } from "./UI";

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
interface SelectModelOption extends BaseModelOption {
  type: "select";
  options: Option[];
}
interface ToggleModelOption extends BaseModelOption {
  type: "toggle";
}

type ModelOption = RangeModelOption | SelectModelOption | ToggleModelOption;

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
              {
                key: "modelComplexity",
                name: "model-complexity",
                type: "select",
                options: Array.from(Array(3), (_, index) => ({
                  label: index,
                  value: index,
                })),
              },
            ] as ModelOption[]
          }
        >
          {(item) => (
            <Switch>
              <Match when={item.type === "range"}>
                <RangeInput
                  containerClass="flex items-center justify-between space-x-4 capitalize"
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
              <Match when={item.type === "select"}>
                <Select
                  containerClass="flex items-center justify-between space-x-4 capitalize"
                  name={item.name}
                  onChange={(value) =>
                    updateModelOptions({
                      [item.key]: parseInt(value, 10),
                    })
                  }
                  options={(item as SelectModelOption).options}
                  value={(state.model.options[item.key] as number) ?? 0}
                >
                  {item.name.split("-").join(" ")}:
                </Select>
              </Match>
              {/* <Match when={item.type === "toggle"}></Match> */}
            </Switch>
          )}
        </For>
      </div>
    </section>
  );
}
