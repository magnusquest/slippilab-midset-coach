import { Show, createSignal } from "solid-js";
import { ChatInterface } from "~/components/common/ChatInterface";
import {
  chatHistory,
  loadedContext,
  matchup,
  resetChat,
  sendCoachMessage,
} from "~/state/coachStore";
import { characterNameByExternalId } from "~/common/ids";

export function PreGameChat() {
  const [isSending, setIsSending] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  async function handleSend(message: string): Promise<void> {
    setError(null);
    setIsSending(true);
    try {
      await sendCoachMessage(message);
    } catch (err) {
      setError(
        (err as Error).message ??
          "Unable to reach the coach right now. Please try again."
      );
    } finally {
      setIsSending(false);
    }
  }

  function handlePreset(message: string) {
    void handleSend(message);
  }

  const matchupLabel = () => {
    const data = matchup();
    const playerName =
      characterNameByExternalId[data.player] ?? `Character ${data.player}`;
    const opponentName =
      characterNameByExternalId[data.opponent] ?? `Character ${data.opponent}`;
    return `${playerName} vs ${opponentName}`;
  };

  return (
    <div class="flex h-full flex-col gap-4 rounded border border-slate-200 bg-white p-4">
      <div class="flex flex-col gap-1">
        <h3 class="text-base font-semibold text-slate-800">Pre-Game Coach</h3>
        <p class="text-sm text-slate-600">
          You are preparing for{" "}
          <span class="font-medium">{matchupLabel()}</span>. Use this space to
          align on gameplan, mental cues, and adaptations.
        </p>
      </div>
      <Show when={loadedContext().length === 0}>
        <div class="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          No prior review notes found for this matchup. Play a few games and add
          notes to build richer coaching context.
        </div>
      </Show>
      <ChatInterface
        messages={chatHistory()}
        onSend={handleSend}
        isBusy={isSending()}
        placeholder="Share your plan or challenges for this matchup..."
        footer={() => (
          <div class="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <button
              type="button"
              class="rounded border border-slate-300 px-2 py-1 text-slate-600 hover:bg-slate-100"
              onClick={() =>
                handlePreset(
                  "What should my neutral game focus on for this matchup?"
                )
              }
            >
              Ask about neutral
            </button>
            <button
              type="button"
              class="rounded border border-slate-300 px-2 py-1 text-slate-600 hover:bg-slate-100"
              onClick={() =>
                handlePreset("Help me craft a gameplan for the first stock.")
              }
            >
              Gameplan prompt
            </button>
            <button
              type="button"
              class="rounded border border-slate-300 px-2 py-1 text-slate-600 hover:bg-slate-100"
              onClick={() => resetChat()}
            >
              Reset conversation
            </button>
            <Show when={error()}>
              <span class="text-red-600">{error()}</span>
            </Show>
          </div>
        )}
      />
    </div>
  );
}
