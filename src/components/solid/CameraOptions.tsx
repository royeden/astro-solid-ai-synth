// import { createSignal, onMount } from "solid-js";
import { state, updateCamera } from "~store/global";
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
  // TODO implement our own camera implementation, the mediapipe won't allow re building a Camera instance, it stays in memory
  // const [cameras, setCameras] = createSignal([]);
  // onMount(() => {
  //   if (typeof window !== undefined) {
  //     navigator.mediaDevices.enumerateDevices().then(devices => devices.filter(device => device.kind === "videoinput")).then(setCameras);
  //   }
  // });
  return (
    <section class="w-full max-w-lg space-y-2">
      <p class="text-lg font-bold">Camera Options</p>
      <Select
        containerClass="max-w-md flex items-center justify-between"
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
        Dimensions:
      </Select>
      <Button onClick={() => updateCamera({ active: !state.camera.active })}>
        Turn Camera {state.camera.active ? "Off" : "On"}
      </Button>
    </section>
  );
}
