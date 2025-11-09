import { Accessor, createEffect, createSignal } from "solid-js";
import {
  getMatchupReviews,
  reviewNotes,
  ReviewNote,
} from "~/state/reviewNotesStore";
import type { ChatMessage } from "~/state/aiStore";
import {
  sendChatMessage,
  startRealtimeSession as openRealtimeSession,
  endRealtimeSession as closeRealtimeSession,
} from "~/state/aiStore";
import { characterNameByExternalId, stageNameByExternalId } from "~/common/ids";

interface Matchup {
  player: number;
  opponent: number;
}

const DEFAULT_MATCHUP: Matchup = { player: 2, opponent: 3 }; // Fox vs Falco

const [matchupSignal, setMatchupSignal] =
  createSignal<Matchup>(DEFAULT_MATCHUP);
const [contextGameCountSignal, setContextGameCountSignal] =
  createSignal<number>(10);
const [loadedContextSignal, setLoadedContextSignal] = createSignal<ReviewNote[]>(
  []
);
const [chatHistorySignal, setChatHistorySignal] = createSignal<ChatMessage[]>(
  []
);
const [isLiveSessionSignal, setIsLiveSessionSignal] =
  createSignal<boolean>(false);
const [realtimeConnectionSignal, setRealtimeConnectionSignal] =
  createSignal<WebSocket | null>(null);

createEffect(() => {
  void reviewNotes();
  const matchup = matchupSignal();
  const contextCount = contextGameCountSignal();
  const notes = getMatchupReviews(matchup.player, matchup.opponent, contextCount);
  setLoadedContextSignal(notes);
});

export const matchup: Accessor<Matchup> = matchupSignal;
export function setMatchup(player: number, opponent: number): void {
  setMatchupSignal({ player, opponent });
  resetChat();
}

export const contextGameCount: Accessor<number> = contextGameCountSignal;
export function setContextGameCount(count: number): void {
  const sanitized = Number.isFinite(count) ? Math.max(1, Math.floor(count)) : 1;
  setContextGameCountSignal(sanitized);
}

export const loadedContext: Accessor<ReviewNote[]> = loadedContextSignal;

export const chatHistory: Accessor<ChatMessage[]> = chatHistorySignal;
export function addChatMessage(message: ChatMessage): void {
  setChatHistorySignal((history) => [...history, message]);
}
export function resetChat(): void {
  setChatHistorySignal([]);
}

export const isLiveSession: Accessor<boolean> = isLiveSessionSignal;
export const realtimeConnection: Accessor<WebSocket | null> =
  realtimeConnectionSignal;

export async function startLiveSession(initialContext: string): Promise<void> {
  if (isLiveSessionSignal()) {
    return;
  }
  try {
    const socket = await openRealtimeSession(initialContext);
    setRealtimeConnectionSignal(socket);
    setIsLiveSessionSignal(true);
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error("Failed to start live session.");
  }
}

export function endLiveSession(): void {
  if (!isLiveSessionSignal()) {
    return;
  }
  closeRealtimeSession();
  setRealtimeConnectionSignal(null);
  setIsLiveSessionSignal(false);
}

export async function sendCoachMessage(
  userMessage: string
): Promise<void> {
  const trimmed = userMessage.trim();
  if (trimmed.length === 0) {
    return;
  }
  const history = chatHistorySignal();
  const systemPrompt = buildSystemPrompt(
    matchupSignal(),
    loadedContextSignal()
  );
  const userChatMessage: ChatMessage = { role: "user", content: trimmed };
  addChatMessage(userChatMessage);
  try {
    const assistantReply = await sendChatMessage([
      { role: "system", content: systemPrompt },
      ...history,
      userChatMessage,
    ]);
    addChatMessage({ role: "assistant", content: assistantReply });
  } catch (error) {
    // Roll back user message on failure to avoid confusing transcript
    setChatHistorySignal((prev) =>
      prev.slice(0, Math.max(0, prev.length - 1))
    );
    throw error instanceof Error
      ? error
      : new Error("Failed to send message to coach.");
  }
}

function buildSystemPrompt(matchup: Matchup, context: ReviewNote[]): string {
  const playerName =
    characterNameByExternalId[matchup.player] ?? `Character ${matchup.player}`;
  const opponentName =
    characterNameByExternalId[matchup.opponent] ??
    `Character ${matchup.opponent}`;
  const contextSummary =
    context.length === 0
      ? "No prior review notes are available."
      : context
            .map((note) => {
              const date = note.replayMetadata.date.toLocaleDateString();
              const stageName =
                stageNameByExternalId[note.replayMetadata.stage] ??
                `Stage ${note.replayMetadata.stage}`;
              return [
                `Game (${date}) on ${stageName}:`,
                note.review.keyLearnings
                  ? `Key Learnings: ${note.review.keyLearnings}`
                  : null,
                note.review.matchupNotes
                  ? `Matchup Notes: ${note.review.matchupNotes}`
                  : null,
                note.review.whatWentWrong
                  ? `Struggles: ${note.review.whatWentWrong}`
                  : null,
              ]
                .filter(Boolean)
                .join(" ");
            })
          .join("\n---\n");

  return [
    "You are a Super Smash Bros. Melee coach preparing a player for their next match.",
    `The player is using ${playerName} against an opponent's ${opponentName}.`,
    "Leverage the recent review notes to provide concise strategic guidance, focus points, and actionable advice.",
    "Encourage the player to think critically and ask clarifying questions when helpful.",
    "Context from previous matches:",
    contextSummary,
  ].join("\n");
}
