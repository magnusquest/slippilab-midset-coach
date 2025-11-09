export interface MicrophoneSession {
  recorder: MediaRecorder;
  stream: MediaStream;
}

export async function startMicrophone(
  onChunk: (data: ArrayBuffer) => void
): Promise<MicrophoneSession> {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error("Microphone access is not supported in this browser.");
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const recorder = new MediaRecorder(stream, {
    mimeType: "audio/webm",
  });

  recorder.addEventListener("dataavailable", async (event) => {
    if (!event.data || event.data.size === 0) {
      return;
    }
    try {
      const buffer = await event.data.arrayBuffer();
      onChunk(buffer);
    } catch (error) {
      console.error("Failed to process audio chunk", error);
    }
  });

  recorder.start(250);

  return { recorder, stream };
}

export function stopMicrophone(session: MicrophoneSession | null): void {
  if (!session) {
    return;
  }
  const { recorder, stream } = session;
  if (recorder.state !== "inactive") {
    recorder.stop();
  }
  stream.getTracks().forEach((track) => track.stop());
}
