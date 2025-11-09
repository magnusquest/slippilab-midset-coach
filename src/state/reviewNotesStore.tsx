import { Accessor, createSignal } from "solid-js";
import {
  getAllRecords,
  putRecord,
  deleteRecord,
  reviewNotesStoreName,
} from "~/common/indexedDB";

export interface ReviewNote {
  id: string;
  replayFileName: string;
  replayMetadata: {
    playerCharacter: number;
    opponentCharacter: number;
    stage: number;
    date: Date;
  };
  review: {
    whatWentWell: string;
    whatWentWrong: string;
    keyLearnings: string;
    matchupNotes: string;
  };
  createdAt: Date;
  updatedAt: Date;
  isAiGenerated: boolean;
}

interface StoredReviewNote {
  id: string;
  replayFileName: string;
  replayMetadata: {
    playerCharacter: number;
    opponentCharacter: number;
    stage: number;
    date: string;
  };
  review: ReviewNote["review"];
  createdAt: string;
  updatedAt: string;
  isAiGenerated: boolean;
}

type ReviewNotesMap = Map<string, ReviewNote>;

const [reviewNotesSignal, setReviewNotesSignal] = createSignal<ReviewNotesMap>(
  new Map()
);

const [hasLoaded, setHasLoaded] = createSignal(false);
const [pendingReviewId, setPendingReviewId] = createSignal<string | null>(null);

function deserializeReviewNote(note: StoredReviewNote): ReviewNote {
  return {
    ...note,
    replayMetadata: {
      ...note.replayMetadata,
      date: new Date(note.replayMetadata.date),
    },
    createdAt: new Date(note.createdAt),
    updatedAt: new Date(note.updatedAt),
  };
}

function serializeReviewNote(note: ReviewNote): StoredReviewNote {
  return {
    ...note,
    replayMetadata: {
      ...note.replayMetadata,
      date: note.replayMetadata.date.toISOString(),
    },
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  };
}

export const reviewNotes: Accessor<ReviewNotesMap> = reviewNotesSignal;
export const pendingReview = pendingReviewId;
export function scheduleReviewPrompt(replayId: string | null): void {
  setPendingReviewId(replayId);
}
export function clearPendingReview(): void {
  setPendingReviewId(null);
}

export async function loadReviewNotes(): Promise<void> {
  if (hasLoaded()) {
    return;
  }
  try {
    const records = await getAllRecords<StoredReviewNote>(
      reviewNotesStoreName()
    );
    const next = new Map<string, ReviewNote>();
    records.forEach((record) => {
      const note = deserializeReviewNote(record);
      next.set(note.id, note);
    });
    setReviewNotesSignal(next);
    setHasLoaded(true);
  } catch (error) {
    console.error("Failed to load review notes", error);
    setReviewNotesSignal(new Map());
  }
}

export function getReviewNote(replayId: string): ReviewNote | undefined {
  return reviewNotesSignal().get(replayId);
}

export async function saveReviewNote(note: ReviewNote): Promise<void> {
  const serialized = serializeReviewNote(note);
  await putRecord(reviewNotesStoreName(), serialized);
  setReviewNotesSignal((current) => {
    const next = new Map(current);
    next.set(note.id, note);
    return next;
  });
}

export async function deleteReviewNote(replayId: string): Promise<void> {
  await deleteRecord(reviewNotesStoreName(), replayId);
  setReviewNotesSignal((current) => {
    const next = new Map(current);
    next.delete(replayId);
    return next;
  });
}

export function getMatchupReviews(
  char1: number,
  char2: number,
  limit: number
): ReviewNote[] {
  const notes = Array.from(reviewNotesSignal().values()).filter(
    (note) =>
      note.replayMetadata.playerCharacter === char1 &&
      note.replayMetadata.opponentCharacter === char2
  );
  notes.sort(
    (a, b) =>
      b.replayMetadata.date.getTime() - a.replayMetadata.date.getTime()
  );
  return notes.slice(0, limit);
}
