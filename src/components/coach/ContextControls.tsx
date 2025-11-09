import { Show, createSignal } from "solid-js";
import {
  contextGameCount,
  loadedContext,
  setContextGameCount,
  chatHistory,
  resetChat,
} from "~/state/coachStore";

export function ContextControls() {
  const [localCount, setLocalCount] = createSignal(contextGameCount());

  function handleBlur() {
    setContextGameCount(localCount());
  }

  return (
    <div class="rounded border border-slate-200 bg-slate-50 p-4">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label class="flex flex-col gap-1 text-sm text-slate-600">
          Load last X games
          <input
            type="number"
            min="1"
            value={localCount()}
            onInput={(event) =>
              setLocalCount(
                Math.max(1, Number.parseInt(event.currentTarget.value, 10) || 1)
              )
            }
            onBlur={handleBlur}
            class="w-28 rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slippi-400 focus:outline-none focus:ring-2 focus:ring-slippi-300"
          />
        </label>
        <div class="text-sm text-slate-600">
          Loaded {loadedContext().length} review
          {loadedContext().length === 1 ? "" : "s"} from your last{" "}
          {contextGameCount()} games.
        </div>
      </div>
      <Show when={chatHistory().length > 0}>
        <div class="mt-3 flex items-center justify-between rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          <span>
            Updating context mid-chat? Consider restarting the conversation to
            use the latest notes.
          </span>
          <button
            type="button"
            class="rounded border border-amber-400 px-2 py-1 text-amber-700 hover:bg-amber-100"
            onClick={() => resetChat()}
          >
            Reset Chat
          </button>
        </div>
      </Show>
    </div>
  );
}
