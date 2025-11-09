/**
 * AIReviewDialog Component
 * Guided Socratic review using ChatGPT
 */

import { createSignal, For, Show, onMount } from "solid-js";
import { Dialog } from "~/components/common/Dialog";
import { WhiteButton } from "~/components/common/Button";
import { ChatInterface } from "~/components/common/ChatInterface";
import { ReviewNote } from "~/common/indexedDB";
import { ChatMessage, sendChatMessage, apiKey } from "~/state/aiStore";

interface AIReviewDialogProps {
  replayInfo: {
    fileName: string;
    playerCharacter: string;
    opponentCharacter: string;
    stage: string;
  };
  onComplete: (note: Partial<ReviewNote["review"]>) => void;
  onCancel: () => void;
}

const REVIEW_FIELDS = [
  { key: "whatWentWell", label: "What went well" },
  { key: "whatWentWrong", label: "What went wrong" },
  { key: "keyLearnings", label: "Key learnings" },
  { key: "matchupNotes", label: "Matchup notes" },
] as const;

export function AIReviewDialog(props: AIReviewDialogProps) {
  const [currentFieldIndex, setCurrentFieldIndex] = createSignal(0);
  const [messages, setMessages] = createSignal<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = createSignal(false);
  const [reviewData, setReviewData] = createSignal<
    Partial<ReviewNote["review"]>
  >({});
  const [isOpen, setIsOpen] = createSignal(true);

  onMount(() => {
    initializeReview();
  });

  const initializeReview = () => {
    const systemPrompt = `You are a Super Smash Bros. Melee coach helping a player review their gameplay. 
Use the Socratic method to guide them through reflection. Ask thoughtful questions to help them analyze their performance.

Replay details:
- Player character: ${props.replayInfo.playerCharacter}
- Opponent character: ${props.replayInfo.opponentCharacter}
- Stage: ${props.replayInfo.stage}

You will guide the player through 4 sections: what went well, what went wrong, key learnings, and matchup notes.
Start with the first section: "What went well". Ask 1-2 guiding questions, then help them summarize their thoughts.
Keep your responses concise and focused.`;

    const initialMessages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      {
        role: "assistant",
        content: `Let's review your ${props.replayInfo.playerCharacter} vs ${props.replayInfo.opponentCharacter} game on ${props.replayInfo.stage}!\n\nFirst, let's talk about what went well. What moments are you proud of in this game?`,
      },
    ];

    setMessages(initialMessages);
  };

  const handleSendMessage = async (userMessage: string) => {
    if (!apiKey()) {
      alert("Please set your OpenAI API key in Settings");
      return;
    }

    const newMessages: ChatMessage[] = [
      ...messages(),
      { role: "user", content: userMessage },
    ];
    setMessages(newMessages);
    setIsStreaming(true);

    try {
      const stream = await sendChatMessage(newMessages);
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((line) => line.trim() !== "");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                assistantMessage += content;
                setMessages([
                  ...newMessages,
                  { role: "assistant", content: assistantMessage },
                ]);
              }
            } catch (e) {
              // Skip parse errors
            }
          }
        }
      }
    } catch (error) {
      console.error("Error streaming response:", error);
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleNextField = () => {
    const currentField = REVIEW_FIELDS[currentFieldIndex()];
    const lastAssistantMessage = [...messages()]
      .reverse()
      .find((m) => m.role === "assistant")?.content;

    if (lastAssistantMessage) {
      setReviewData({
        ...reviewData(),
        [currentField.key]: lastAssistantMessage,
      });
    }

    const nextIndex = currentFieldIndex() + 1;
    if (nextIndex < REVIEW_FIELDS.length) {
      setCurrentFieldIndex(nextIndex);
      const nextField = REVIEW_FIELDS[nextIndex];

      setMessages([
        ...messages(),
        {
          role: "assistant",
          content: `Great! Now let's move to: ${nextField.label}. What are your thoughts on this?`,
        },
      ]);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    props.onComplete(reviewData());
    setIsOpen(false);
  };

  const handleCancel = () => {
    props.onCancel();
    setIsOpen(false);
  };

  const currentField = () => REVIEW_FIELDS[currentFieldIndex()];
  const progress = () =>
    `${currentFieldIndex() + 1} / ${REVIEW_FIELDS.length}`;

  return (
    <Show when={isOpen()}>
      <Dialog>
        <Dialog.Trigger>
          <div />
        </Dialog.Trigger>
        <Dialog.Title>
          <div class="flex items-center justify-between">
            <div class="text-lg">AI-Assisted Review</div>
            <div class="text-sm text-slate-600">
              Progress: {progress()} - {currentField().label}
            </div>
          </div>
        </Dialog.Title>
        <Dialog.Contents>
          <div class="my-5 h-96">
            <ChatInterface
              messages={messages()}
              onSendMessage={handleSendMessage}
              isLoading={isStreaming()}
              disabled={isStreaming()}
              placeholder="Share your thoughts..."
            />
          </div>
          <div class="flex w-full justify-between">
            <WhiteButton onClick={handleCancel}>Cancel</WhiteButton>
            <div class="flex gap-2">
              <Show when={currentFieldIndex() < REVIEW_FIELDS.length - 1}>
                <button
                  type="button"
                  class="inline-flex w-fit items-center rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-slippi-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleNextField}
                  disabled={isStreaming()}
                >
                  Next Section
                </button>
              </Show>
              <Show when={currentFieldIndex() === REVIEW_FIELDS.length - 1}>
                <button
                  type="button"
                  class="inline-flex w-fit items-center rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-slippi-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleComplete}
                  disabled={isStreaming()}
                >
                  Complete Review
                </button>
              </Show>
            </div>
          </div>
        </Dialog.Contents>
      </Dialog>
    </Show>
  );
}
