import { For, Show, createMemo, createSignal, onMount } from "solid-js";
import type { JSX } from "solid-js";
import { PrimaryButton, SecondaryButton, WhiteButton } from "~/components/common/Button";
import { characterNameByExternalId, stageNameByExternalId } from "~/common/ids";
import { Dialog } from "~/components/common/Dialog";
import { ChatInterface } from "~/components/common/ChatInterface";
import type { ReplayStub } from "~/state/selectionStore";
import type { ReviewNote } from "~/state/reviewNotesStore";
import {
  ChatMessage,
  apiKey,
  sendChatMessage,
} from "~/state/aiStore";

interface AIReviewDialogProps {
  replayStub: ReplayStub;
  existingNote?: ReviewNote;
  onComplete: (result: {
    review: ReviewNote["review"];
    isAiGenerated: boolean;
  }) => Promise<void> | void;
  children: JSX.Element;
}

interface FieldDefinition {
  key: keyof ReviewNote["review"];
  label: string;
  prompt: string;
}

const REVIEW_FIELDS: FieldDefinition[] = [
  {
    key: "whatWentWell",
    label: "What Went Well",
    prompt:
      "Focus on successful strategies, neutral wins, punish game, and any adaptations that worked.",
  },
  {
    key: "whatWentWrong",
    label: "What Went Wrong",
    prompt:
      "Explore mistakes, dropped conversions, bad habits, or moments you lost control.",
  },
  {
    key: "keyLearnings",
    label: "Key Learnings",
    prompt:
      "Summarize the main takeaways the player should remember for future matches.",
  },
  {
    key: "matchupNotes",
    label: "Matchup Notes",
    prompt:
      "Capture matchup-specific insights, opponent tendencies, and counterplay ideas.",
  },
];

export function AIReviewDialog(props: AIReviewDialogProps) {
  return (
    <Dialog>
      <Dialog.Trigger>{props.children}</Dialog.Trigger>
      <Dialog.Title>
        <div class="text-lg font-semibold">AI Socratic Review</div>
      </Dialog.Title>
      <Dialog.Contents>
        <AIReviewDialogContent
          replayStub={props.replayStub}
          existingNote={props.existingNote}
          onComplete={props.onComplete}
        />
      </Dialog.Contents>
    </Dialog>
  );
}

function AIReviewDialogContent(props: {
  replayStub: ReplayStub;
  existingNote?: ReviewNote;
  onComplete: (result: {
    review: ReviewNote["review"];
    isAiGenerated: boolean;
  }) => Promise<void> | void;
}) {
  const dialogApi = Dialog.useDialogApi();
  const [currentStep, setCurrentStep] = createSignal(0);
  const [chatHistory, setChatHistory] = createSignal<ChatMessage[]>([]);
  const [draftReview, setDraftReview] = createSignal<ReviewNote["review"]>({
    whatWentWell: props.existingNote?.review.whatWentWell ?? "",
    whatWentWrong: props.existingNote?.review.whatWentWrong ?? "",
    keyLearnings: props.existingNote?.review.keyLearnings ?? "",
    matchupNotes: props.existingNote?.review.matchupNotes ?? "",
  });
  const [isBusy, setIsBusy] = createSignal(false);
  const [hasUsedAi, setHasUsedAi] = createSignal(
    props.existingNote?.isAiGenerated ?? false
  );
  const [error, setError] = createSignal<string | null>(null);

  const hasApiKey = createMemo(() => apiKey().trim().length > 0);

  const matchupContext = createMemo(() => {
    const players = props.replayStub.playerSettings.filter(Boolean);
    const player =
      players.find((p) => p.playerIndex === 0) ?? players.at(0);
    const opponent =
      players.find((p) => p.playerIndex === 1) ?? players.at(1);
    const playerName =
      player?.displayName || player?.connectCode || "Player 1";
    const opponentName =
      opponent?.displayName || opponent?.connectCode || "Player 2";
    const playerCharacter =
      (player && characterNameByExternalId[player.externalCharacterId]) ??
      "Unknown";
    const opponentCharacter =
      (opponent && characterNameByExternalId[opponent.externalCharacterId]) ??
      "Unknown";
    const stageName =
      stageNameByExternalId[props.replayStub.stageId] ?? "Unknown Stage";
    return `${playerName} (${playerCharacter}) vs ${opponentName} (${opponentCharacter}) on ${stageName}`;
  });

  onMount(() => {
    void prepareStep(0);
  });

  async function prepareStep(stepIndex: number) {
    setError(null);
    if (!hasApiKey()) {
      setChatHistory([]);
      return;
    }
    setIsBusy(true);
    try {
      const field = REVIEW_FIELDS[stepIndex];
      const systemMessage: ChatMessage = {
        role: "system",
        content: [
          "You are a Super Smash Bros. Melee coach guiding a player through a reflective review.",
          `Conversation context: ${matchupContext()}.`,
          `Focus only on ${field.label}. Ask Socratic questions one at a time.`,
          "Keep responses short (2-3 sentences) and ask targeted follow-ups.",
        ].join(" "),
      };
      const kickoffUserMessage: ChatMessage = {
        role: "user",
        content: `Greet the player and ask your first question about ${field.label}.`,
      };
      const assistantReply = await sendChatMessage([
        systemMessage,
        kickoffUserMessage,
      ]);
      setChatHistory([
        systemMessage,
        kickoffUserMessage,
        { role: "assistant", content: assistantReply },
      ]);
    } catch (err) {
      setError(
        (err as Error).message ??
          "Failed to start AI conversation. Try again later."
      );
      setChatHistory([]);
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSend(message: string) {
    setIsBusy(true);
    setError(null);
    const userMessage: ChatMessage = { role: "user", content: message };
    setChatHistory((prev) => [...prev, userMessage]);
    try {
      const response = await sendChatMessage([
        ...chatHistory(),
        userMessage,
      ]);
      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: response },
      ]);
    } catch (err) {
      setError(
        (err as Error).message ??
          "The AI couldn't respond. Check your connection or API key."
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSummarize() {
    const field = REVIEW_FIELDS[currentStep()];
    setIsBusy(true);
    setError(null);
    try {
      const summary = await sendChatMessage([
        ...chatHistory(),
        {
          role: "user",
          content: `Summarize the key insights from our conversation so I can write "${field.label}". Focus on actionable, first-person statements.`,
        },
      ]);
      setDraftReview((prev) => ({
        ...prev,
        [field.key]: summary.trim(),
      }));
      setHasUsedAi(true);
    } catch (err) {
      setError(
        (err as Error).message ??
          "Unable to generate a summary. Please try again."
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function goToStep(stepIndex: number) {
    setCurrentStep(stepIndex);
    await prepareStep(stepIndex);
  }

  function handleManualUpdate(
    field: keyof ReviewNote["review"],
    value: string
  ) {
    setDraftReview((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function handleSave() {
    setIsBusy(true);
    setError(null);
    try {
      await props.onComplete({
        review: draftReview(),
        isAiGenerated: hasUsedAi(),
      });
      dialogApi().close();
    } catch (err) {
      setError(
        (err as Error).message ?? "Failed to save review. Please try again."
      );
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div class="flex max-h-[70vh] flex-col gap-5">
      <Show
        when={hasApiKey()}
        fallback={
          <div class="rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Add an OpenAI API key in Settings to unlock AI-assisted reviews.
          </div>
        }
      >
        <div class="flex items-center justify-between">
          <div class="text-sm font-medium text-slate-700">
            Step {currentStep() + 1} of {REVIEW_FIELDS.length} ·{" "}
            {REVIEW_FIELDS[currentStep()].label}
          </div>
          <div class="text-xs text-slate-500">
            {matchupContext()}
          </div>
        </div>
        <ChatInterface
          messages={chatHistory()}
          onSend={handleSend}
          isBusy={isBusy()}
          placeholder="Share what happened in that situation..."
          footer={() => (
            <div class="flex flex-col gap-2">
              <SecondaryButton
                type="button"
                disabled={isBusy()}
                onClick={() => void handleSummarize()}
              >
                Generate AI Summary
              </SecondaryButton>
              <div class="text-xs italic text-slate-500">
                Use the chat to explore your thinking. When you're ready,
                generate a summary and refine it below.
              </div>
            </div>
          )}
        />
        <div class="space-y-4">
          <For each={REVIEW_FIELDS}>
            {(field, index) => (
              <Show when={index() === currentStep()}>
                <div class="flex flex-col gap-2">
                  <label class="text-sm font-semibold text-slate-700">
                    {field.label}
                  </label>
                  <textarea
                    rows={4}
                    value={draftReview()[field.key]}
                    onInput={(event) =>
                      handleManualUpdate(field.key, event.currentTarget.value)
                    }
                    placeholder={field.prompt}
                    class="w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slippi-400 focus:outline-none focus:ring-2 focus:ring-slippi-300"
                  />
                </div>
              </Show>
            )}
          </For>
        </div>
        <Show when={error()}>
          <div class="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
            {error()}
          </div>
        </Show>
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <WhiteButton
              type="button"
              disabled={currentStep() === 0 || isBusy()}
              onClick={() => void goToStep(currentStep() - 1)}
            >
              Previous
            </WhiteButton>
            <Show
              when={currentStep() < REVIEW_FIELDS.length - 1}
              fallback={
                <PrimaryButton
                  type="button"
                  disabled={isBusy()}
                  onClick={() => void handleSave()}
                >
                  Save Review
                </PrimaryButton>
              }
            >
              <PrimaryButton
                type="button"
                disabled={isBusy()}
                onClick={() => void goToStep(currentStep() + 1)}
              >
                Next
              </PrimaryButton>
            </Show>
          </div>
          <div class="text-xs text-slate-500">
            {hasUsedAi()
              ? "AI assistance applied."
              : "You can edit any field manually before saving."}
          </div>
        </div>
      </Show>
    </div>
  );
}
