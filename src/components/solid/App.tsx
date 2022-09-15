import { onMount, Show } from "solid-js";
import Instructions from "~components/solid/Instructions";
import {
  getStoredConfig,
  nodeReferences,
  setupCanvasContext,
  setupMidi,
  setupModel,
  setupStoredConfig,
  state,
} from "~store/global";
import { CameraOptions } from "./CameraOptions";
import { MidiOptions } from "./MidiOptions";
import { ModelOptions } from "./ModelOptions";
import { TrackingOptions } from "./TrackingOptions";
import { Card } from "./UI";

export function App() {
  onMount(() => {
    if (typeof window !== undefined) {
      setupStoredConfig(getStoredConfig());
      setupCanvasContext();
      setupMidi();
      function setupModelIfAvailable(retries = 10) {
        if (retries) {
          if (
            window.Holistic &&
            window.Camera &&
            !!window.drawConnectors &&
            !!window.drawLandmarks
          ) {
            setupModel();
          } else {
            setTimeout(() => setupModelIfAvailable(retries - 1), 1000);
          }
        } else {
          throw new Error(
            "Couldn't load the model, please check your internet connection!"
          );
        }
      }
      setupModelIfAvailable();
    }
  });

  return (
    <div class="relative flex h-full w-full flex-col items-center">
      <div class="grid max-w-screen-xl grid-cols-1 items-start justify-items-center gap-4 lg:grid-cols-2">
        <Card class="sticky top-1 z-40 w-full max-w-lg rounded-lg p-4 lg:max-w-none">
          <video class="hidden" ref={nodeReferences.video!} />
          <div class="space-y-4">
            <div class="relative overflow-hidden rounded-lg">
              <canvas
                class="h-full w-full"
                style={{
                  transform: "rotateY(180deg)",
                }}
                ref={nodeReferences.canvas!}
              />
              <Show when={!state.camera.active || state.model.loading}>
                <div
                  class="absolute inset-0 flex items-center justify-center bg-gray-900 text-white dark:bg-black"
                  classList={{
                    "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite_cubic-bezier(0.4,0,0.2,1)] before:border-t before:border-rose-100/10 before:bg-gradient-to-r before:from-transparent before:via-rose-100/10 before:to-transparent":
                      state.model.loading,
                  }}
                >
                  {state.model.loading
                    ? "Loading model..."
                    : "Camera is off..."}
                </div>
              </Show>
            </div>
            <CameraOptions />
            <ModelOptions />
          </div>
        </Card>
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
