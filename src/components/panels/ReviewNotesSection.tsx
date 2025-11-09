import { Show, createEffect, createMemo, createSignal } from "solid-js";
import type { JSX } from "solid-js";
import {
  PrimaryButton,
  SecondaryButton,
  WhiteButton,
} from "~/components/common/Button";
import type { SelectionStore, ReplayStub } from "~/state/selectionStore";
import {
  ReviewNote,
  clearPendingReview,
  deleteReviewNote,
  getReviewNote,
  pendingReview,
  saveReviewNote,
} from "~/state/reviewNotesStore";
import { characterNameByExternalId, stageNameByExternalId } from "~/common/ids";
import { AIReviewDialog } from "~/components/panels/AIReviewDialog";

interface DraftReview {
  whatWentWell: string;
  whatWentWrong: string;
  keyLearnings: string;
  matchupNotes: string;
}

export function ReviewNotesSection(props: { selectionStore: SelectionStore }) {
  const [isEditing, setIsEditing] = createSignal(false);
  const [isSaving, setIsSaving] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [draft, setDraft] = createSignal<DraftReview>({
    whatWentWell: "",
    whatWentWrong: "",
    keyLearnings: "",
    matchupNotes: "",
  });

  const selectedStub = createMemo<ReplayStub | undefined>(
    () => props.selectionStore.data.selectedFileAndStub?.[1]
  );

  const currentNote = createMemo<ReviewNote | undefined>(() => {
    const stub = selectedStub();
    return stub ? getReviewNote(stub.fileName) : undefined;
  });

  createEffect(() => {
    const note = currentNote();
    if (note) {
      setDraft({ ...note.review });
      setIsEditing(false);
    } else {
      setDraft({
        whatWentWell: "",
        whatWentWrong: "",
        keyLearnings: "",
        matchupNotes: "",
      });
      setIsEditing(false);
    }
  });

  async function handleSave(isAiGenerated: boolean) {
    const stub = selectedStub();
    if (!stub) {
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const existing = currentNote();
      const now = new Date();
      const sanitized: DraftReview = {
        whatWentWell: draft().whatWentWell.trim(),
        whatWentWrong: draft().whatWentWrong.trim(),
        keyLearnings: draft().keyLearnings.trim(),
        matchupNotes: draft().matchupNotes.trim(),
      };
      if (Object.values(sanitized).every((value) => value.length === 0)) {
        setError("Add at least one note before saving your review.");
        setIsSaving(false);
        return;
      }
      setDraft(sanitized);
      const note: ReviewNote = {
        id: stub.fileName,
        replayFileName: stub.fileName,
        replayMetadata: {
          playerCharacter: getCharacterId(stub, 0),
          opponentCharacter: getCharacterId(stub, 1),
          stage: stub.stageId,
          date: new Date(stub.playedOn),
        },
        review: sanitized,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
        isAiGenerated,
      };
      await saveReviewNote(note);
      clearPendingReview();
      setIsEditing(false);
    } catch (err) {
      setError(
        (err as Error).message ?? "Failed to save review. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    const stub = selectedStub();
    if (!stub) {
      return;
    }
    if (!window.confirm("Delete this review note? This cannot be undone.")) {
      return;
    }
    setError(null);
    try {
      await deleteReviewNote(stub.fileName);
      clearPendingReview();
      setDraft({
        whatWentWell: "",
        whatWentWrong: "",
        keyLearnings: "",
        matchupNotes: "",
      });
      setIsEditing(false);
    } catch (err) {
      setError((err as Error).message ?? "Failed to delete review note.");
    }
  }

  function startManualReview() {
    clearPendingReview();
    const note = currentNote();
    if (note) {
      setDraft({ ...note.review });
    } else {
      setDraft({
        whatWentWell: "",
        whatWentWrong: "",
        keyLearnings: "",
        matchupNotes: "",
      });
    }
    setIsEditing(true);
  }

  return (
    <div class="w-full rounded border border-slate-200 bg-white p-4">
      <Show
        when={selectedStub()}
        keyed
        fallback={
          <div class="text-sm text-slate-500">
            Select a replay to add review notes.
          </div>
        }
      >
        {(stub) => (
          <div class="flex flex-col gap-4">
            <header class="flex flex-col gap-1">
              <h2 class="text-base font-semibold text-slate-800">
                Review Notes
              </h2>
              <div class="text-sm text-slate-500">{descriptor(stub)}</div>
            </header>
            <Show when={error()}>
              <div class="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
                {error()}
              </div>
            </Show>
            <Show
              when={isEditing()}
              fallback={
                <ReadOnlyView
                  note={currentNote()}
                  isPromptActive={
                    pendingReview() === stub.fileName && !currentNote()
                  }
                  onManualReview={startManualReview}
                  onDelete={handleDelete}
                  aiDialog={
                    <AIReviewDialog
                      replayStub={stub}
                      existingNote={currentNote()}
                      onComplete={async ({ review, isAiGenerated }) => {
                        setDraft(review);
                        await handleSave(isAiGenerated);
                      }}
                    >
                      <SecondaryButton type="button">AI Review</SecondaryButton>
                    </AIReviewDialog>
                  }
                />
              }
            >
              <EditView
                draft={draft()}
                isSaving={isSaving()}
                onChange={(field, value) =>
                  setDraft((prev) => ({ ...prev, [field]: value }))
                }
                onCancel={() => {
                  setIsEditing(false);
                }}
                onSave={() => void handleSave(false)}
              />
            </Show>
          </div>
        )}
      </Show>
    </div>
  );
}

function descriptor(stub: ReplayStub) {
  const players = getPlayers(stub);
  const primary =
    players.find((player) => player.playerIndex === 0) ?? players.at(0);
  const opponent =
    players.find((player) => player.playerIndex === 1) ?? players.at(1);
  const playerCharacter =
    (primary && characterNameByExternalId[primary.externalCharacterId]) ??
    "Unknown";
  const opponentCharacter =
    (opponent && characterNameByExternalId[opponent.externalCharacterId]) ??
    "Unknown";
  const stageName = stageNameByExternalId[stub.stageId] ?? "Unknown Stage";
  const playedDate = new Date(stub.playedOn).toLocaleString();
  return `${playerCharacter} vs ${opponentCharacter} · ${stageName} · ${playedDate}`;
}

function ReadOnlyView(props: {
  note: ReviewNote | undefined;
  isPromptActive: boolean;
  onManualReview: () => void;
  onDelete: () => void;
  aiDialog: JSX.Element;
}) {
  if (!props.note) {
    return (
      <div class="flex flex-col gap-4 rounded border border-slate-200 bg-slate-50 p-4">
        <Show
          when={props.isPromptActive}
          fallback={
            <div class="text-sm text-slate-600">
              No notes yet. Start a manual review or let the AI guide you.
            </div>
          }
        >
          <div class="text-sm font-medium text-slate-700">
            Would you like to review this game?
          </div>
        </Show>
        <div class="flex flex-wrap gap-2">
          <PrimaryButton type="button" onClick={props.onManualReview}>
            Add Manual Review
          </PrimaryButton>
          {props.aiDialog}
        </div>
      </div>
    );
  }

  return (
    <div class="flex flex-col gap-4">
      <div class="grid gap-3 rounded border border-slate-200 bg-slate-50 p-4">
        <ReviewField
          label="What Went Well"
          value={props.note.review.whatWentWell}
        />
        <ReviewField
          label="What Went Wrong"
          value={props.note.review.whatWentWrong}
        />
        <ReviewField
          label="Key Learnings"
          value={props.note.review.keyLearnings}
        />
        <ReviewField
          label="Matchup Notes"
          value={props.note.review.matchupNotes}
        />
      </div>
      <div class="flex items-center justify-between text-xs text-slate-500">
        <div>
          {props.note.isAiGenerated
            ? "Generated with AI assistance"
            : "Manual note"}
        </div>
        <div>Updated {props.note.updatedAt.toLocaleString()}</div>
      </div>
      <div class="flex flex-wrap gap-2">
        <PrimaryButton type="button" onClick={props.onManualReview}>
          Edit Notes
        </PrimaryButton>
        {props.aiDialog}
        <WhiteButton type="button" onClick={props.onDelete}>
          Delete
        </WhiteButton>
      </div>
    </div>
  );
}

function EditView(props: {
  draft: DraftReview;
  isSaving: boolean;
  onChange: (field: keyof DraftReview, value: string) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <form class="flex flex-col gap-4">
      <EditableField
        label="What Went Well"
        placeholder="Capture your successes, good habits, and breakthroughs."
        value={props.draft.whatWentWell}
        onChange={(value) => props.onChange("whatWentWell", value)}
      />
      <EditableField
        label="What Went Wrong"
        placeholder="Note mistakes, struggles, or patterns that caused problems."
        value={props.draft.whatWentWrong}
        onChange={(value) => props.onChange("whatWentWrong", value)}
      />
      <EditableField
        label="Key Learnings"
        placeholder="Summarize the major lessons you want to remember."
        value={props.draft.keyLearnings}
        onChange={(value) => props.onChange("keyLearnings", value)}
      />
      <EditableField
        label="Matchup Notes"
        placeholder="Add matchup-specific insights, opponent habits, and counterplay ideas."
        value={props.draft.matchupNotes}
        onChange={(value) => props.onChange("matchupNotes", value)}
      />
      <div class="flex flex-wrap gap-2">
        <PrimaryButton
          type="button"
          disabled={props.isSaving}
          onClick={() => props.onSave()}
        >
          {props.isSaving ? "Saving…" : "Save Notes"}
        </PrimaryButton>
        <WhiteButton
          type="button"
          disabled={props.isSaving}
          onClick={props.onCancel}
        >
          Cancel
        </WhiteButton>
      </div>
    </form>
  );
}

function ReviewField(props: { label: string; value: string }) {
  return (
    <div class="flex flex-col gap-1">
      <div class="text-sm font-semibold text-slate-700">{props.label}</div>
      <div class="whitespace-pre-line rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
        {props.value.length > 0 ? props.value : "—"}
      </div>
    </div>
  );
}

function EditableField(props: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label class="flex flex-col gap-2 text-sm">
      <span class="font-semibold text-slate-700">{props.label}</span>
      <textarea
        rows={4}
        value={props.value}
        onInput={(event) => props.onChange(event.currentTarget.value)}
        placeholder={props.placeholder}
        class="w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slippi-400 focus:outline-none focus:ring-2 focus:ring-slippi-300"
      />
    </label>
  );
}

function getPlayers(stub: ReplayStub) {
  return stub.playerSettings.filter(
    (player): player is NonNullable<typeof player> => Boolean(player)
  );
}

function getCharacterId(stub: ReplayStub, playerIndex: number): number {
  const players = getPlayers(stub);
  return (
    players.find((player) => player.playerIndex === playerIndex)
      ?.externalCharacterId ??
    players.at(playerIndex)?.externalCharacterId ??
    -1
  );
}
