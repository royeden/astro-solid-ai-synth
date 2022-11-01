import { createSignal, onMount, Show } from "solid-js";
import Instructions from "~components/solid/Instructions";
import { IS_IN_CLIENT } from "~constants/env";
import {
  getStoredConfig,
  DOM_NODE_REFERENCES,
  setupCanvasContext,
  setupMidi,
  setupModel,
  setupStoredConfig,
  state,
} from "~store/global";
import { CameraOptions } from "./CameraOptions";
import { OutlineWindowIcon, SolidWindowIcon } from "./Icons";
import { MidiOptions } from "./MidiOptions";
import { ModelOptions } from "./ModelOptions";
import { TrackingOptions } from "./TrackingOptions";
import { Button, Card } from "./UI";

function CameraView() {
  const [follow, setFollow] = createSignal(false);
  return (
    <Card
      class="z-40 w-full max-w-lg overflow-hidden rounded-lg lg:max-w-none"
      classList={{
        "sticky top-1": follow(),
      }}
    >
      <video class="hidden" ref={DOM_NODE_REFERENCES.video!} />
      <div>
        <div class="relative">
          <canvas
            class="h-full w-full"
            style={{
              transform: "rotateY(180deg)",
            }}
            ref={DOM_NODE_REFERENCES.canvas!}
          />
          <Show when={!state.camera.active || state.model.loading}>
            <div
              class="absolute inset-0 flex items-center justify-center bg-gray-900 text-white dark:bg-black"
              classList={{
                "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite_cubic-bezier(0.4,0,0.2,1)] before:border-t before:border-rose-100/10 before:bg-gradient-to-r before:from-transparent before:via-rose-100/10 before:to-transparent":
                  state.model.loading,
              }}
            >
              {state.model.loading ? "Loading model..." : "Camera is off..."}
            </div>
          </Show>
          <Button
            class="absolute top-1 right-1"
            icon
            onClick={() => setFollow((prev) => !prev)}
            title={`${
              follow() ? "Enable" : "Disable"
            } camera sticked to the top`}
          >
            <Show when={follow()} fallback={<OutlineWindowIcon />}>
              <SolidWindowIcon />
            </Show>
          </Button>
        </div>
        <div class="space-y-4 p-4">
          <CameraOptions />
          <ModelOptions />
        </div>
      </div>
    </Card>
  );
}

export function App() {
  onMount(() => {
    if (IS_IN_CLIENT) {
      setupStoredConfig(getStoredConfig());
      setupCanvasContext();
      setupMidi();
      setupModel();
    }
  });

  return (
    <div class="relative flex h-full w-full flex-col items-center">
      <div class="grid max-w-screen-xl grid-cols-1 items-start justify-items-center gap-4 lg:grid-cols-2">
        <CameraView />
        <Card class="flex w-full max-w-lg flex-col items-center space-y-2 p-4 lg:max-w-none">
          <Instructions />
          <MidiOptions />
        </Card>
        <div class="w-full lg:col-span-2">
          <TrackingOptions />
        </div>
      </div>
    </div>
  );
}
