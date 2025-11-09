/**
 * CoachPanel Component
 * Main interface for Coach Mode - pre-game setup and coaching
 */

import { createSignal, createEffect, Show, For } from "solid-js";
import { characterNameByExternalId } from "~/common/ids";
import { WhiteButton } from "~/components/common/Button";
import { ChatInterface } from "~/components/common/ChatInterface";
import {
  matchup,
  updateMatchup,
  contextGameCount,
  updateContextGameCount,
  loadedContext,
  updateLoadedContext,
  chatHistory,
  addChatMessage,
  clearChatHistory,
  generateContextSummary,
} from "~/state/coachStore";
import { getMatchupReviewNotes } from "~/state/reviewNotesStore";
import { sendChatMessage, apiKey, ChatMessage } from "~/state/aiStore";

export function CoachPanel() {
  const [isLoadingContext, setIsLoadingContext] = createSignal(false);
  const [isStreaming, setIsStreaming] = createSignal(false);
  const [selectedPlayerChar, setSelectedPlayerChar] = createSignal(matchup().player);
  const [selectedOpponentChar, setSelectedOpponentChar] = createSignal(matchup().opponent);
  const [selectedGameCount, setSelectedGameCount] = createSignal(contextGameCount());

  // Load context when matchup or count changes
  const handleLoadContext = async () => {
    setIsLoadingContext(true);
    try {
      const reviews = await getMatchupReviewNotes(
        selectedPlayerChar(),
        selectedOpponentChar(),
        selectedGameCount()
      );
      updateLoadedContext(reviews);
      updateMatchup(selectedPlayerChar(), selectedOpponentChar());
      updateContextGameCount(selectedGameCount());

      // Initialize chat with context
      initializeCoachingChat();
    } catch (error) {
      console.error("Error loading context:", error);
    } finally {
      setIsLoadingContext(false);
    }
  };

  const initializeCoachingChat = () => {
    if (!apiKey()) {
      return;
    }

    const contextSummary = generateContextSummary();
    const playerCharName = characterNameByExternalId[selectedPlayerChar()];
    const opponentCharName = characterNameByExternalId[selectedOpponentChar()];

    const systemMessage: ChatMessage = {
      role: "system",
      content: `You are a Super Smash Bros. Melee coach helping prepare a player for their next game.

Matchup: ${playerCharName} vs ${opponentCharName}

${contextSummary}

Guide the player through pre-game strategy, help them focus on key aspects of the matchup, and provide tactical advice. Keep your responses concise and actionable.`,
    };

    const welcomeMessage: ChatMessage = {
      role: "assistant",
      content: `Welcome! Let's prepare for your ${playerCharName} vs ${opponentCharName} match.\n\nI've loaded ${loadedContext().length} of your recent games. ${loadedContext().length > 0 ? "What would you like to work on in this session?" : "Let's discuss this matchup!"}`,
    };

    clearChatHistory();
    addChatMessage(systemMessage);
    addChatMessage(welcomeMessage);
  };

  const handleSendMessage = async (message: string) => {
    if (!apiKey()) {
      alert("Please set your OpenAI API key in Settings");
      return;
    }

    const userMessage: ChatMessage = { role: "user", content: message };
    addChatMessage(userMessage);
    setIsStreaming(true);

    try {
      const stream = await sendChatMessage(chatHistory());
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
                // Update the last message in chat history
                const history = chatHistory();
                if (history[history.length - 1]?.role === "assistant") {
                  history[history.length - 1].content = assistantMessage;
                } else {
                  addChatMessage({ role: "assistant", content: assistantMessage });
                }
              }
            } catch (e) {
              // Skip parse errors
            }
          }
        }
      }

      // Ensure the final message is added
      const history = chatHistory();
      if (history[history.length - 1]?.role !== "assistant" || !assistantMessage) {
        addChatMessage({ role: "assistant", content: assistantMessage });
      }
    } catch (error) {
      console.error("Error streaming response:", error);
      addChatMessage({
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
      });
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div class="flex h-full flex-col gap-4 p-4">
      <h2 class="text-xl font-bold">Coach Mode</h2>

      {/* Matchup Selector */}
      <div class="rounded border border-slate-300 bg-white p-4">
        <h3 class="mb-3 font-semibold">Matchup Setup</h3>
        
        <div class="mb-3 grid grid-cols-2 gap-4">
          <div>
            <label class="mb-1 block text-sm font-medium">Your Character</label>
            <select
              class="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={selectedPlayerChar()}
              onChange={(e) => setSelectedPlayerChar(Number(e.currentTarget.value))}
            >
              <For each={characterNameByExternalId}>
                {(name, index) => <option value={index()}>{name}</option>}
              </For>
            </select>
          </div>
          
          <div>
            <label class="mb-1 block text-sm font-medium">Opponent Character</label>
            <select
              class="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={selectedOpponentChar()}
              onChange={(e) => setSelectedOpponentChar(Number(e.currentTarget.value))}
            >
              <For each={characterNameByExternalId}>
                {(name, index) => <option value={index()}>{name}</option>}
              </For>
            </select>
          </div>
        </div>

        <div class="mb-3">
          <label class="mb-1 block text-sm font-medium">
            Load last <input
              type="number"
              class="w-16 rounded border border-slate-300 px-2 py-1 text-sm"
              min="1"
              max="50"
              value={selectedGameCount()}
              onInput={(e) => setSelectedGameCount(Number(e.currentTarget.value))}
            /> games
          </label>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            class="inline-flex w-fit items-center rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-slippi-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleLoadContext}
            disabled={isLoadingContext()}
          >
            {isLoadingContext() ? "Loading..." : "Load Context & Start"}
          </button>
          <Show when={loadedContext().length > 0}>
            <span class="text-sm text-slate-600">
              Loaded {loadedContext().length} reviews
            </span>
          </Show>
        </div>
      </div>

      {/* Chat Interface */}
      <Show when={chatHistory().length > 1}>
        <div class="flex-1 overflow-hidden rounded border border-slate-300 bg-white">
          <div class="h-full p-4">
            <ChatInterface
              messages={chatHistory()}
              onSendMessage={handleSendMessage}
              isLoading={isStreaming()}
              disabled={isStreaming() || !apiKey()}
              placeholder={
                apiKey()
                  ? "Ask about strategy, tactics, or this matchup..."
                  : "Please set your API key in Settings first"
              }
            />
          </div>
        </div>
      </Show>

      {/* Placeholder for future live session */}
      <Show when={false}>
        <div class="rounded border border-slate-300 bg-slate-50 p-4">
          <p class="text-sm text-slate-600">
            Live session feature coming soon...
          </p>
        </div>
      </Show>
    </div>
  );
}
