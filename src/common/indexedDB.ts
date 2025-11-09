/**
 * IndexedDB utilities for MidSet Coach
 * Handles database initialization and operations for review notes
 */

const DB_NAME = "midset-coach-db";
const DB_VERSION = 1;
const REVIEW_NOTES_STORE = "review-notes";

export interface ReviewNote {
  id: string; // unique ID tied to replay file
  replayFileName: string;
  replayMetadata: {
    playerCharacter: number; // character ID
    opponentCharacter: number;
    stage: number;
    date: string; // ISO 8601 format
  };
  review: {
    whatWentWell: string;
    whatWentWrong: string;
    keyLearnings: string;
    matchupNotes: string;
  };
  createdAt: string; // ISO 8601 format
  updatedAt: string; // ISO 8601 format
  isAiGenerated: boolean;
}

/**
 * Initialize IndexedDB database
 */
export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create review-notes store if it doesn't exist
      if (!db.objectStoreNames.contains(REVIEW_NOTES_STORE)) {
        const store = db.createObjectStore(REVIEW_NOTES_STORE, {
          keyPath: "id",
        });

        // Create indexes for efficient querying
        store.createIndex("replayFileName", "replayFileName", {
          unique: false,
        });
        store.createIndex(
          "playerCharacter",
          "replayMetadata.playerCharacter",
          { unique: false }
        );
        store.createIndex(
          "opponentCharacter",
          "replayMetadata.opponentCharacter",
          { unique: false }
        );
        store.createIndex("date", "replayMetadata.date", { unique: false });

        // Compound index for matchup queries
        store.createIndex(
          "matchup",
          ["replayMetadata.playerCharacter", "replayMetadata.opponentCharacter"],
          { unique: false }
        );
      }
    };
  });
}

/**
 * Get a review note by ID
 */
export async function getReviewNote(
  id: string
): Promise<ReviewNote | undefined> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([REVIEW_NOTES_STORE], "readonly");
    const store = transaction.objectStore(REVIEW_NOTES_STORE);
    const request = store.get(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

/**
 * Save a review note (create or update)
 */
export async function saveReviewNote(note: ReviewNote): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([REVIEW_NOTES_STORE], "readwrite");
    const store = transaction.objectStore(REVIEW_NOTES_STORE);
    const request = store.put(note);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Delete a review note by ID
 */
export async function deleteReviewNote(id: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([REVIEW_NOTES_STORE], "readwrite");
    const store = transaction.objectStore(REVIEW_NOTES_STORE);
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Get all review notes
 */
export async function getAllReviewNotes(): Promise<ReviewNote[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([REVIEW_NOTES_STORE], "readonly");
    const store = transaction.objectStore(REVIEW_NOTES_STORE);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

/**
 * Get review notes for a specific matchup
 * @param playerChar - Player character ID
 * @param opponentChar - Opponent character ID
 * @param limit - Maximum number of notes to return (default: 10)
 */
export async function getMatchupReviews(
  playerChar: number,
  opponentChar: number,
  limit: number = 10
): Promise<ReviewNote[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([REVIEW_NOTES_STORE], "readonly");
    const store = transaction.objectStore(REVIEW_NOTES_STORE);
    const index = store.index("matchup");
    const request = index.getAll([playerChar, opponentChar]);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      // Sort by date descending and limit results
      const results = (request.result as ReviewNote[])
        .sort(
          (a, b) =>
            new Date(b.replayMetadata.date).getTime() -
            new Date(a.replayMetadata.date).getTime()
        )
        .slice(0, limit);
      resolve(results);
    };
  });
}

/**
 * Get review note by replay file name
 */
export async function getReviewNoteByFileName(
  fileName: string
): Promise<ReviewNote | undefined> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([REVIEW_NOTES_STORE], "readonly");
    const store = transaction.objectStore(REVIEW_NOTES_STORE);
    const index = store.index("replayFileName");
    const request = index.get(fileName);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}
