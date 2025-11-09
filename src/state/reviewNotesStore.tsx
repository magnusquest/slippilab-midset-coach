/**
 * Review Notes Store
 * Manages review notes for replay files using IndexedDB
 */

import { createSignal } from "solid-js";
import {
  ReviewNote,
  getAllReviewNotes,
  getReviewNote,
  saveReviewNote as saveReviewNoteDB,
  deleteReviewNote as deleteReviewNoteDB,
  getMatchupReviews,
  getReviewNoteByFileName,
} from "~/common/indexedDB";

// Map of replay ID to review note
const [reviewNotes, setReviewNotes] = createSignal<Map<string, ReviewNote>>(
  new Map()
);

// Loading state
const [isLoading, setIsLoading] = createSignal(false);

/**
 * Load all review notes from IndexedDB
 */
export async function loadReviewNotes(): Promise<void> {
  setIsLoading(true);
  try {
    const notes = await getAllReviewNotes();
    const notesMap = new Map<string, ReviewNote>();
    notes.forEach((note) => notesMap.set(note.id, note));
    setReviewNotes(notesMap);
  } catch (error) {
    console.error("Failed to load review notes:", error);
  } finally {
    setIsLoading(false);
  }
}

/**
 * Get a review note by replay ID
 */
export function getReviewNoteById(id: string): ReviewNote | undefined {
  return reviewNotes().get(id);
}

/**
 * Get a review note by replay file name
 */
export async function getReviewByFileName(
  fileName: string
): Promise<ReviewNote | undefined> {
  return getReviewNoteByFileName(fileName);
}

/**
 * Save a review note
 */
export async function saveReviewNote(note: ReviewNote): Promise<void> {
  try {
    await saveReviewNoteDB(note);
    // Update in-memory cache
    const updatedNotes = new Map(reviewNotes());
    updatedNotes.set(note.id, note);
    setReviewNotes(updatedNotes);
  } catch (error) {
    console.error("Failed to save review note:", error);
    throw error;
  }
}

/**
 * Delete a review note
 */
export async function deleteReviewNote(id: string): Promise<void> {
  try {
    await deleteReviewNoteDB(id);
    // Update in-memory cache
    const updatedNotes = new Map(reviewNotes());
    updatedNotes.delete(id);
    setReviewNotes(updatedNotes);
  } catch (error) {
    console.error("Failed to delete review note:", error);
    throw error;
  }
}

/**
 * Get review notes for a specific matchup
 */
export async function getMatchupReviewNotes(
  playerChar: number,
  opponentChar: number,
  limit: number = 10
): Promise<ReviewNote[]> {
  try {
    return await getMatchupReviews(playerChar, opponentChar, limit);
  } catch (error) {
    console.error("Failed to get matchup reviews:", error);
    return [];
  }
}

/**
 * Create a new review note
 */
export function createReviewNote(
  replayId: string,
  replayFileName: string,
  playerCharacter: number,
  opponentCharacter: number,
  stage: number,
  date: string,
  isAiGenerated: boolean = false
): ReviewNote {
  const now = new Date().toISOString();
  return {
    id: replayId,
    replayFileName,
    replayMetadata: {
      playerCharacter,
      opponentCharacter,
      stage,
      date,
    },
    review: {
      whatWentWell: "",
      whatWentWrong: "",
      keyLearnings: "",
      matchupNotes: "",
    },
    createdAt: now,
    updatedAt: now,
    isAiGenerated,
  };
}

// Export signals
export { reviewNotes, isLoading as isLoadingReviewNotes };
