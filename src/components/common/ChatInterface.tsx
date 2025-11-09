/**
 * ChatInterface Component
 * Reusable chat interface for AI conversations
 */

import { createSignal, For, Show, onMount, createEffect } from "solid-js";
import { ChatMessage } from "~/state/aiStore";
import { WhiteButton } from "~/components/common/Button";

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export function ChatInterface(props: ChatInterfaceProps) {
  const [inputMessage, setInputMessage] = createSignal("");
  let messagesEndRef: HTMLDivElement | undefined;

  // Auto-scroll to bottom when new messages arrive
  createEffect(() => {
    if (props.messages.length > 0 && messagesEndRef) {
      messagesEndRef.scrollIntoView({ behavior: "smooth" });
    }
  });

  const handleSend = () => {
    const message = inputMessage().trim();
    if (message && !props.disabled) {
      props.onSendMessage(message);
      setInputMessage("");
    }
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div class="flex h-full flex-col">
      {/* Messages area */}
      <div class="flex-1 overflow-y-auto border border-slate-300 bg-white p-4">
        <For each={props.messages.filter((m) => m.role !== "system")}>
          {(message) => (
            <div
              classList={{
                "mb-4 flex": true,
                "justify-end": message.role === "user",
                "justify-start": message.role === "assistant",
              }}
            >
              <div
                classList={{
                  "max-w-[80%] rounded-lg px-4 py-2": true,
                  "bg-slippi-500 text-white": message.role === "user",
                  "bg-slate-100 text-slate-900": message.role === "assistant",
                }}
              >
                <div class="whitespace-pre-wrap break-words text-sm">
                  {message.content}
                </div>
              </div>
            </div>
          )}
        </For>
        <Show when={props.isLoading}>
          <div class="mb-4 flex justify-start">
            <div class="max-w-[80%] rounded-lg bg-slate-100 px-4 py-2">
              <div class="text-sm text-slate-600">Thinking...</div>
            </div>
          </div>
        </Show>
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div class="mt-2 flex gap-2">
        <textarea
          class="flex-1 rounded border border-slate-300 p-2 text-sm"
          rows={2}
          placeholder={props.placeholder || "Type your message..."}
          value={inputMessage()}
          onInput={(e) => setInputMessage(e.currentTarget.value)}
          onKeyPress={handleKeyPress}
          disabled={props.disabled}
        />
        <button
          type="button"
          class="inline-flex w-fit items-center rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-slippi-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSend}
          disabled={props.disabled || !inputMessage().trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}
