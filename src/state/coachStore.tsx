/**
 * Coach Store
 * Manages Coach mode state including matchup selection, context, and live sessions
 */

import { createSignal } from "solid-js";
import { ChatMessage } from "~/state/aiStore";
import { ReviewNote } from "~/common/indexedDB";

// Matchup configuration
const [matchup, setMatchup] = createSignal<{
  player: number;
  opponent: number;
}>({
  player: 0, // Default: Falcon
  opponent: 9, // Default: Marth
});

// Context configuration
const [contextGameCount, setContextGameCount] = createSignal<number>(10);

// Loaded context from past games
const [loadedContext, setLoadedContext] = createSignal<ReviewNote[]>([]);

// Pre-game chat history
const [chatHistory, setChatHistory] = createSignal<ChatMessage[]>([]);

// Live session state
const [isLiveSession, setIsLiveSession] = createSignal<boolean>(false);

// Realtime WebSocket connection
const [realtimeConnection, setRealtimeConnection] =
  createSignal<WebSocket | null>(null);

// Live session transcript
const [liveTranscript, setLiveTranscript] = createSignal<
  Array<{ speaker: "user" | "assistant"; text: string; timestamp: number }>
>([]);

/**
 * Update matchup selection
 */
export function updateMatchup(player: number, opponent: number): void {
  setMatchup({ player, opponent });
}

/**
 * Update context game count
 */
export function updateContextGameCount(count: number): void {
  setContextGameCount(count);
}

/**
 * Set loaded context from reviews
 */
export function updateLoadedContext(reviews: ReviewNote[]): void {
  setLoadedContext(reviews);
}

/**
 * Add a message to chat history
 */
export function addChatMessage(message: ChatMessage): void {
  setChatHistory([...chatHistory(), message]);
}

/**
 * Clear chat history
 */
export function clearChatHistory(): void {
  setChatHistory([]);
}

/**
 * Set chat history (for replacing entire history)
 */
export function replaceChatHistory(messages: ChatMessage[]): void {
  setChatHistory(messages);
}

/**
 * Start a live coaching session
 */
export function startLiveSession(ws: WebSocket): void {
  setIsLiveSession(true);
  setRealtimeConnection(ws);
  setLiveTranscript([]);
}

/**
 * End the live coaching session
 */
export function endLiveSession(): void {
  const ws = realtimeConnection();
  if (ws) {
    ws.close();
  }
  setIsLiveSession(false);
  setRealtimeConnection(null);
}

/**
 * Add a transcript entry
 */
export function addTranscriptEntry(
  speaker: "user" | "assistant",
  text: string
): void {
  setLiveTranscript([
    ...liveTranscript(),
    { speaker, text, timestamp: Date.now() },
  ]);
}

/**
 * Generate context summary for live session
 */
export function generateContextSummary(): string {
  const reviews = loadedContext();
  const { player, opponent } = matchup();

  if (reviews.length === 0) {
    return "No previous games to analyze.";
  }

  const summary = `
Recent ${reviews.length} games analyzed:

Common patterns:
- What went well: ${reviews.map((r) => r.review.whatWentWell).filter(Boolean).join("; ")}
- What went wrong: ${reviews.map((r) => r.review.whatWentWrong).filter(Boolean).join("; ")}
- Key learnings: ${reviews.map((r) => r.review.keyLearnings).filter(Boolean).join("; ")}
- Matchup notes: ${reviews.map((r) => r.review.matchupNotes).filter(Boolean).join("; ")}
  `.trim();

  return summary;
}

// Export signals
export {
  matchup,
  contextGameCount,
  loadedContext,
  chatHistory,
  isLiveSession,
  realtimeConnection,
  liveTranscript,
};
