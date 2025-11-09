import { For, Show, createSignal, createMemo } from "solid-js";
import type { JSX } from "solid-js";
import { SecondaryButton } from "~/components/common/Button";
import type { ChatMessage } from "~/state/aiStore";

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSend: (message: string) => Promise<void> | void;
  isBusy?: boolean;
  placeholder?: string;
  footer?: () => JSX.Element;
}

export function ChatInterface(props: ChatInterfaceProps) {
  const [draft, setDraft] = createSignal("");
  const [error, setError] = createSignal<string | null>(null);

  const filteredMessages = createMemo(() =>
    props.messages.filter((message) => message.role !== "system")
  );

  async function handleSubmit(event: Event) {
    event.preventDefault();
    setError(null);
    const message = draft().trim();
    if (message.length === 0) {
      return;
    }
    try {
      await props.onSend(message);
      setDraft("");
    } catch (err) {
      setError((err as Error).message ?? "Failed to send message.");
    }
  }

  return (
    <div class="flex h-full flex-col gap-3">
      <div class="flex flex-1 flex-col gap-2 overflow-y-auto rounded border border-slate-200 bg-slate-50 p-3 text-sm">
        <Show
          when={filteredMessages().length > 0}
          fallback={
            <div class="text-slate-500">
              No messages yet. Share your thoughts to begin.
            </div>
          }
        >
          <For each={filteredMessages()}>
            {(message) => (
              <div
                classList={{
                  "self-start rounded-lg bg-white px-3 py-2 shadow":
                    message.role === "assistant",
                  "self-end rounded-lg bg-slippi-100 px-3 py-2 text-slippi-800":
                    message.role === "user",
                }}
              >
                <div class="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {message.role === "assistant" ? "Coach" : "You"}
                </div>
                <div class="whitespace-pre-line">{message.content}</div>
              </div>
            )}
          </For>
        </Show>
      </div>
      <form class="flex flex-col gap-2" onSubmit={handleSubmit}>
        <textarea
          value={draft()}
          onInput={(event) => setDraft(event.currentTarget.value ?? "")}
          placeholder={props.placeholder ?? "Type your response..."}
          rows={3}
          class="w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slippi-400 focus:outline-none focus:ring-2 focus:ring-slippi-300"
          disabled={props.isBusy}
        />
        <div class="flex items-center justify-between">
          <div class="text-sm text-red-600">
            <Show when={error()}>{error()}</Show>
          </div>
          <div class="flex items-center gap-2">
            <SecondaryButton
              type="submit"
              disabled={props.isBusy || draft().trim().length === 0}
            >
              {props.isBusy ? "Sending…" : "Send"}
            </SecondaryButton>
          </div>
        </div>
      </form>
      <Show when={props.footer}>{props.footer?.()}</Show>
    </div>
  );
}
