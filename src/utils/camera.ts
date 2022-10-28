function stopStreamTracks(stream: MediaStream) {
  stream.getTracks().forEach((track) => track.stop());
}

export async function getCameras(): Promise<void | MediaDeviceInfo[]> {
  try {
    const devices = (await navigator.mediaDevices.enumerateDevices()).filter(
      (device) => device.kind === "videoinput"
    );

    // Check if video devices are enabled
    if (devices?.[0]?.deviceId) {
      return devices;
    }

    // Query for video devices so you can stop it just after
    const tempStream = await navigator.mediaDevices.getUserMedia({
      video: true,
    });
    stopStreamTracks(tempStream);
    return getCameras();
  } catch (error) {
    console.error(error);
    // TODO check what to do if we land here
  }
}

export interface Dimensions {
  height: number;
  width: number;
}

interface CameraOptions extends Dimensions {
  deviceId: string;
  onFrame: () => void | Promise<void>;
}

export class Camera {
  #frame?: number;
  #options: CameraOptions;
  #stream?: MediaStream;
  #time?: number;
  #video: HTMLVideoElement;

  constructor(videoElement: HTMLVideoElement, options: CameraOptions) {
    this.#video = videoElement;
    this.#options = options;
  }

  #tick() {
    this.#frame = requestAnimationFrame(async () => {
      if (!this.#video.paused || this.#video.currentTime !== this.#time) {
        this.#time = this.#video.currentTime;
        await this.#options.onFrame();
      }
      this.#tick();
    });
  }

  async start() {
    const { deviceId, height, width } = this.#options;
    this.#stream = await navigator.mediaDevices.getUserMedia({
      video: {
        deviceId,
        height,
        width,
      },
    });
    this.#video.srcObject = this.#stream;
    this.#video.onloadedmetadata = () => this.#video.play();
    this.#tick();
  }

  stop() {
    if (this.#stream) stopStreamTracks(this.#stream);
    if (this.#frame) cancelAnimationFrame(this.#frame);
  }

  async update(options: Partial<CameraOptions>) {
    this.stop();
    this.#options = { ...this.#options, ...options };
    await this.start();
  }
}
