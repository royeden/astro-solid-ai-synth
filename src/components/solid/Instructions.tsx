export default function Instructions() {
  return (
    <section class="w-full space-y-2">
      <p class="w-full text-lg font-bold">Usage:</p>
      <p class="italic">
        (Anything you do will be saved locally, so please don't use this app in
        incognito until the app can export configs)
      </p>
      <p class="font-bold">
        TL;DR:
        <br />
        Trigger channel is for external gates.
        <br />
        Output channel is where values are sent.
        <br />
        Sending more than one note is sending a chord.
        <br />
        Quantize your values!!!
      </p>
      <p>
        This App uses your webcam with AI to track poses and convert them into
        MIDI messages.
      </p>
      <p>
        Every frame on the browser is tracked and the results of each visible
        landmark are stored individually.
      </p>
      <p>
        To send a landmark's values, you need to set up an output channel (this
        is the channel you need to use in your app consuming MIDI) and a trigger
        channel. This is where you send your clock/gate or any "noteon" message
        that will trigger the process of sending notes to the output channel.
        "noteoff" messages will try to stop the previous notes that were sent so
        they don't get stuck.
      </p>
      <p>
        Notes on the X axis are sent from left (0) to right (127), notes on the
        Y axis are sent from top (0) to bottom (127). Any channel that receives
        more than a single message (either [x, y] or multiple landmarks) will
        send them as a chord, meaning you need to enable poliphony when parsing
        the received notes. The app also tries to eliminate note duplicates, so
        those probably won't be sent.
      </p>
      <p>
        Scale quantization is recommended because the default scale will always
        be chromatic.
      </p>
    </section>
  );
}
