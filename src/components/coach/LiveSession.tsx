import { For, Show, createEffect, createSignal, onCleanup } from "solid-js";
import {
  endLiveSession,
  isLiveSession,
  loadedContext,
  matchup,
  realtimeConnection,
  startLiveSession,
} from "~/state/coachStore";
import { AudioVisualizer } from "~/components/coach/AudioVisualizer";
import { PushToTalkButton } from "~/components/coach/PushToTalkButton";
import { characterNameByExternalId, stageNameByExternalId } from "~/common/ids";
import type { ReviewNote } from "~/state/reviewNotesStore";

export function LiveSession() {
  const [isStarting, setIsStarting] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [transcript, setTranscript] = createSignal<string[]>([]);
  const [isSpeaking, setIsSpeaking] = createSignal(false);

  createEffect(() => {
    if (!isLiveSession()) {
      setIsSpeaking(false);
    }
  });

  createEffect(() => {
    const socket = realtimeConnection();
    if (!socket) {
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      if (typeof event.data === "string") {
        setTranscript((entries) => [...entries, event.data]);
      } else {
        setTranscript((entries) => [
          ...entries,
          "[Received binary audio chunk]",
        ]);
      }
    };

    const handleError = () => {
      setError("Live session connection encountered an error.");
    };

    const handleClose = () => {
      setTranscript((entries) => [
        ...entries,
        "[Session ended by server]",
      ]);
      endLiveSession();
    };

    socket.addEventListener("message", handleMessage);
    socket.addEventListener("error", handleError);
    socket.addEventListener("close", handleClose);

    onCleanup(() => {
      socket.removeEventListener("message", handleMessage);
      socket.removeEventListener("error", handleError);
      socket.removeEventListener("close", handleClose);
    });
  });

  async function handleStart(): Promise<void> {
    setError(null);
    setIsStarting(true);
    try {
      const context = buildSessionContext(
        matchup().player,
        matchup().opponent,
        loadedContext()
      );
      await startLiveSession(context);
      setTranscript([]);
    } catch (err) {
      setError(
        (err as Error).message ??
          "Unable to start live session. Check your API key and network."
      );
    } finally {
      setIsStarting(false);
    }
  }

  function handleStop(): void {
    endLiveSession();
    setIsSpeaking(false);
  }

  return (
    <div class="flex flex-col gap-4 rounded border border-slate-200 bg-slate-50 p-4">
      <div class="flex flex-col gap-1">
        <h3 class="text-base font-semibold text-slate-800">Live Session</h3>
        <p class="text-sm text-slate-600">
          Connect to OpenAI&apos;s Realtime API for hands-free coaching during
          play.
        </p>
      </div>
      <Show
        when={isLiveSession()}
        fallback={
          <div class="flex flex-col gap-3">
            <button
              type="button"
              class="w-fit rounded bg-slippi-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slippi-600 disabled:cursor-not-allowed disabled:bg-slate-300"
              onClick={() => void handleStart()}
              disabled={isStarting()}
            >
              {isStarting() ? "Connecting…" : "Start Live Session"}
            </button>
            <Show when={error()}>
              <div class="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error()}
              </div>
            </Show>
          </div>
        }
      >
        <div class="flex flex-col gap-4">
          <AudioVisualizer isActive={isSpeaking()} />
          <PushToTalkButton
            socket={realtimeConnection}
            onRecordingChange={setIsSpeaking}
            onError={(message) => setError(message)}
          />
          <button
            type="button"
            class="w-fit rounded border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            onClick={handleStop}
          >
            End Session
          </button>
          <Show when={error()}>
            <div class="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error()}
            </div>
          </Show>
          <div class="flex max-h-48 flex-col gap-2 overflow-y-auto rounded border border-slate-200 bg-white p-3 text-sm text-slate-700">
            <Show when={transcript().length > 0} fallback={<div>No transcript yet.</div>}>
              <For each={transcript()}>
                {(line) => <div>{line}</div>}
              </For>
            </Show>
          </div>
        </div>
      </Show>
    </div>
  );
}

function buildSessionContext(
  playerId: number,
  opponentId: number,
  notes: ReviewNote[]
): string {
  const playerName =
    characterNameByExternalId[playerId] ?? `Character ${playerId}`;
  const opponentName =
    characterNameByExternalId[opponentId] ?? `Character ${opponentId}`;
  if (notes.length === 0) {
    return `Coach a ${playerName} player preparing to face ${opponentName}. No prior review notes are available. Provide concise, encouraging guidance.`;
  }
  const summaries = notes.slice(0, 5).map((note) => {
    const stageName =
      stageNameByExternalId[note.replayMetadata.stage] ??
      `Stage ${note.replayMetadata.stage}`;
    return [
      `Match on ${stageName}:`,
      note.review.keyLearnings
        ? `Key learnings: ${note.review.keyLearnings}`
        : null,
      note.review.matchupNotes
        ? `Matchup notes: ${note.review.matchupNotes}`
        : null,
      note.review.whatWentWrong
        ? `Struggles: ${note.review.whatWentWrong}`
        : null,
    ]
      .filter(Boolean)
      .join(" ");
  });

  return [
    `Coach a ${playerName} player preparing to face ${opponentName}.`,
    "Reference these recent notes when giving live advice:",
    summaries.join("\n"),
  ].join("\n");
}
