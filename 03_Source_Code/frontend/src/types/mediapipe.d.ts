declare global {
  interface Window {
    cv?: Record<string, unknown>;
  }
}

declare module '@mediapipe/face_mesh' {
  export class FaceMesh {
    constructor(config: Record<string, unknown>);
    setOptions(options: Record<string, unknown>): void;
    onResults(callback: (results: Record<string, unknown>) => void): void;
    send(config: { image: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement }): Promise<void>;
    initialize(): Promise<void>;
    close(): void;
  }
}

declare module '@mediapipe/camera_utils' {
  export class Camera {
    constructor(videoElement: HTMLVideoElement, config: Record<string, unknown>);
    start(): Promise<void>;
    stop(): void;
  }
}

export {};