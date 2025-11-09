import { Accessor, createSignal, onCleanup } from "solid-js";
import {
  MicrophoneSession,
  startMicrophone,
  stopMicrophone,
} from "~/common/realtimeAPI";

interface PushToTalkButtonProps {
  socket: Accessor<WebSocket | null>;
  disabled?: boolean;
  onRecordingChange?: (isRecording: boolean) => void;
  onError?: (message: string) => void;
}

export function PushToTalkButton(props: PushToTalkButtonProps) {
  const [isRecording, setIsRecording] = createSignal(false);
  let microphoneSession: MicrophoneSession | null = null;

  async function beginRecording(): Promise<void> {
    if (isRecording() || props.disabled) {
      return;
    }
    const socket = props.socket();
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      props.onError?.("Live session is not connected.");
      return;
    }

    try {
      microphoneSession = await startMicrophone((chunk) => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(chunk);
        }
      });
      setIsRecording(true);
      props.onRecordingChange?.(true);
    } catch (error) {
      props.onError?.(
        error instanceof Error
          ? error.message
          : "Microphone access was denied or failed."
      );
      microphoneSession = null;
    }
  }

  function endRecording(): void {
    if (!isRecording()) {
      return;
    }
    stopMicrophone(microphoneSession);
    microphoneSession = null;
    setIsRecording(false);
    props.onRecordingChange?.(false);
  }

  onCleanup(() => {
    stopMicrophone(microphoneSession);
  });

  return (
    <button
      type="button"
      class="rounded-full bg-slippi-500 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-slippi-600 disabled:cursor-not-allowed disabled:bg-slate-300"
      disabled={props.disabled}
      onPointerDown={(event) => {
        event.preventDefault();
        void beginRecording();
      }}
      onPointerUp={(event) => {
        event.preventDefault();
        endRecording();
      }}
      onPointerLeave={() => endRecording()}
      onKeyDown={(event) => {
        if (event.code === "Space" || event.key === " ") {
          event.preventDefault();
          void beginRecording();
        }
      }}
      onKeyUp={(event) => {
        if (event.code === "Space" || event.key === " ") {
          event.preventDefault();
          endRecording();
        }
      }}
    >
      {isRecording() ? "Recording…" : "Hold to Speak"}
    </button>
  );
}
