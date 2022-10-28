import { createSignal, onMount } from "solid-js";
import { IS_IN_CLIENT } from "~constants/env";
import { state, updateCamera } from "~store/global";
import { getCameras } from "~utils/camera";
import { Button, Option, Select } from "./UI";

const CAMERA_DIMENSIONS = [
  {
    label: "640 x 360",
    value: "640-360",
  },
  {
    label: "960 x 540",
    value: "960-540",
  },
  {
    label: "1280 x 720",
    value: "1280-720",
  },
] as Option[];

export function CameraOptions() {
  const [cameras, setCameras] = createSignal<MediaDeviceInfo[]>([]);
  onMount(async () => {
    if (IS_IN_CLIENT) {
      const devices = await getCameras();
      if (devices) setCameras(devices);
    }
  });
  return (
    <section class="w-full space-y-2">
      <p class="text-lg font-bold">Camera Options</p>
      <Select
        class="max-w-md"
        containerClass="flex items-center justify-between space-x-4"
        name="camera-device"
        onChange={(deviceId) => updateCamera({ deviceId })}
        options={cameras().map((camera) => ({
          label: camera.label,
          value: camera.deviceId,
        }))}
        value={state.camera.deviceId}
      >
        Camera
      </Select>
      <Select
        containerClass="flex items-center justify-between"
        name="camera-dimensions"
        onChange={(value) => {
          const [width, height] = value
            .split("-")
            .map((dimension) => parseInt(dimension, 10)) as [number, number];
          updateCamera({
            dimensions: {
              width,
              height,
            },
          });
        }}
        options={CAMERA_DIMENSIONS}
        value={[
          state.camera.dimensions.width,
          state.camera.dimensions.height,
        ].join("-")}
      >
        Resolution (smaller is faster / bigger is better)
      </Select>
      <Button onClick={() => updateCamera({ active: !state.camera.active })}>
        Turn Camera {state.camera.active ? "Off" : "On"}
      </Button>
    </section>
  );
}
