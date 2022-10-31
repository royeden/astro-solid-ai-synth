import { For } from "solid-js";
import { Input, Output, WebMidi } from "webmidi";
import { setState, setupMidi, state, updateMidiInput } from "~store/global";
import { Button, Select } from "./UI";

function toMidiDeviceOption(device: Input | Output, index: number) {
  return {
    label: `(${index}) ${device.name}`,
    value: device.id,
  };
}

export function MidiOptions() {
  return (
    <section class="w-full space-y-2">
      <p class="text-lg font-bold">MIDI Options</p>
      <For
        each={
          [
            {
              label: "MIDI Input:",
              name: "midi-input-device",
              onChange(value: string) {
                updateMidiInput(WebMidi.getInputById(value));
              },
              options: state.midi.input.available.map((device, index) =>
                toMidiDeviceOption(device, index)
              ),
              value: state.midi.input.selected?.id ?? "",
            },
            {
              label: "MIDI Output:",
              name: "midi-output-device",
              onChange(value: string) {
                setState(
                  "midi",
                  "output",
                  "selected",
                  WebMidi.getOutputById(value)
                );
              },
              options: state.midi.output.available.map((device, index) =>
                toMidiDeviceOption(device, index)
              ),
              value: state.midi.output.selected?.id ?? "",
            },
          ] as const
        }
      >
        {(select) => (
          <Select
            containerClass="flex w-full max-w-md items-center justify-between"
            disabled={!state.midi.active}
            name={select.name}
            onChange={select.onChange}
            options={select.options}
            value={select.value}
          >
            {select.label}
          </Select>
        )}
      </For>
      <Button custom class="bg-red-700 enabled:hover:bg-red-600 enabled:focus-visible:bg-red-600" loading={!state.midi.active} onClick={() => setupMidi()}>
        {state.midi.active ? "Reset MIDI devices" : "Resetting MIDI devices..."}
      </Button>
    </section>
  );
}
