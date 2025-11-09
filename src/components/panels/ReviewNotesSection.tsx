/**
 * ReviewNotesSection Component
 * Displays and allows editing of review notes for a replay
 */

import { createSignal, Show } from "solid-js";
import { ReviewNote } from "~/common/indexedDB";
import { WhiteButton } from "~/components/common/Button";

interface ReviewNotesSectionProps {
  note: ReviewNote;
  onSave: (note: ReviewNote) => void;
  onDelete: () => void;
  onAIReview?: () => void;
}

export function ReviewNotesSection(props: ReviewNotesSectionProps) {
  const [isEditing, setIsEditing] = createSignal(false);
  const [editedNote, setEditedNote] = createSignal<ReviewNote>(props.note);

  const handleSave = () => {
    props.onSave(editedNote());
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedNote(props.note);
    setIsEditing(false);
  };

  const updateField = (
    field: keyof ReviewNote["review"],
    value: string
  ) => {
    setEditedNote({
      ...editedNote(),
      review: {
        ...editedNote().review,
        [field]: value,
      },
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div class="border-t border-slate-200 bg-slate-50 p-4">
      <div class="mb-3 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <h3 class="font-semibold">Review Notes</h3>
          <Show when={props.note.isAiGenerated}>
            <span class="text-xs text-slate-500" title="AI-assisted review">
              🤖 AI-assisted
            </span>
          </Show>
        </div>
        <div class="flex gap-2">
          <Show when={!isEditing()}>
            <WhiteButton onClick={() => setIsEditing(true)}>Edit</WhiteButton>
            <Show when={props.onAIReview}>
              <WhiteButton onClick={props.onAIReview}>AI Review</WhiteButton>
            </Show>
            <WhiteButton onClick={props.onDelete}>Delete</WhiteButton>
          </Show>
          <Show when={isEditing()}>
            <WhiteButton onClick={handleSave}>Save</WhiteButton>
            <WhiteButton onClick={handleCancel}>Cancel</WhiteButton>
          </Show>
        </div>
      </div>

      <div class="space-y-3">
        <ReviewField
          label="What went well"
          value={isEditing() ? editedNote().review.whatWentWell : props.note.review.whatWentWell}
          isEditing={isEditing()}
          onChange={(value) => updateField("whatWentWell", value)}
        />
        <ReviewField
          label="What went wrong"
          value={isEditing() ? editedNote().review.whatWentWrong : props.note.review.whatWentWrong}
          isEditing={isEditing()}
          onChange={(value) => updateField("whatWentWrong", value)}
        />
        <ReviewField
          label="Key learnings"
          value={isEditing() ? editedNote().review.keyLearnings : props.note.review.keyLearnings}
          isEditing={isEditing()}
          onChange={(value) => updateField("keyLearnings", value)}
        />
        <ReviewField
          label="Matchup notes"
          value={isEditing() ? editedNote().review.matchupNotes : props.note.review.matchupNotes}
          isEditing={isEditing()}
          onChange={(value) => updateField("matchupNotes", value)}
        />
      </div>

      <div class="mt-2 text-xs text-slate-500">
        Last updated: {new Date(props.note.updatedAt).toLocaleString()}
      </div>
    </div>
  );
}

interface ReviewFieldProps {
  label: string;
  value: string;
  isEditing: boolean;
  onChange: (value: string) => void;
}

function ReviewField(props: ReviewFieldProps) {
  return (
    <div>
      <label class="mb-1 block text-sm font-medium text-slate-700">
        {props.label}
      </label>
      <Show
        when={props.isEditing}
        fallback={
          <div class="whitespace-pre-wrap rounded border border-slate-200 bg-white p-2 text-sm">
            {props.value || <span class="text-slate-400">No notes</span>}
          </div>
        }
      >
        <textarea
          class="w-full rounded border border-slate-300 p-2 text-sm"
          rows={3}
          value={props.value}
          onInput={(e) => props.onChange(e.currentTarget.value)}
          placeholder={`Enter ${props.label.toLowerCase()}...`}
        />
      </Show>
    </div>
  );
}
