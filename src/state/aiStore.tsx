/**
 * AI Store
 * Manages OpenAI API integration for chat and realtime voice coaching
 */

import { createSignal } from "solid-js";

// API key stored in localStorage
const API_KEY_STORAGE_KEY = "openai-api-key";

// User preferences
const [apiKey, setApiKey] = createSignal<string>(
  localStorage.getItem(API_KEY_STORAGE_KEY) || ""
);

const [preferredModel, setPreferredModel] = createSignal<string>(
  localStorage.getItem("openai-model") || "gpt-4-turbo"
);

const [preferredVoice, setPreferredVoice] = createSignal<string>(
  localStorage.getItem("openai-voice") || "alloy"
);

// Active realtime session
const [realtimeConnection, setRealtimeConnection] =
  createSignal<WebSocket | null>(null);

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Save API key to localStorage
 */
export function saveApiKey(key: string): void {
  localStorage.setItem(API_KEY_STORAGE_KEY, key);
  setApiKey(key);
}

/**
 * Clear API key from localStorage
 */
export function clearApiKey(): void {
  localStorage.removeItem(API_KEY_STORAGE_KEY);
  setApiKey("");
}

/**
 * Save preferred model
 */
export function savePreferredModel(model: string): void {
  localStorage.setItem("openai-model", model);
  setPreferredModel(model);
}

/**
 * Save preferred voice
 */
export function savePreferredVoice(voice: string): void {
  localStorage.setItem("openai-voice", voice);
  setPreferredVoice(voice);
}

/**
 * Validate API key by making a test request
 */
export async function validateApiKey(key: string): Promise<boolean> {
  try {
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: {
        Authorization: `Bearer ${key}`,
      },
    });
    return response.ok;
  } catch (error) {
    console.error("API key validation failed:", error);
    return false;
  }
}

/**
 * Send a chat message using the Chat API
 * Returns a ReadableStream for streaming responses
 */
export async function sendChatMessage(
  messages: ChatMessage[]
): Promise<ReadableStream<Uint8Array>> {
  const key = apiKey();
  if (!key) {
    throw new Error("OpenAI API key not set");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: preferredModel(),
      messages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `OpenAI API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`
    );
  }

  return response.body as ReadableStream<Uint8Array>;
}

/**
 * Start a Realtime API session for voice coaching
 * @param initialContext - Initial context to send to the AI
 */
export async function startRealtimeSession(
  initialContext: string
): Promise<WebSocket> {
  const key = apiKey();
  if (!key) {
    throw new Error("OpenAI API key not set");
  }

  // Create WebSocket connection
  const ws = new WebSocket(
    "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01",
    {
      headers: {
        Authorization: `Bearer ${key}`,
        "OpenAI-Beta": "realtime=v1",
      },
    } as any
  );

  return new Promise((resolve, reject) => {
    ws.onopen = () => {
      // Configure session
      ws.send(
        JSON.stringify({
          type: "session.update",
          session: {
            modalities: ["text", "audio"],
            voice: preferredVoice(),
            instructions: `You are a Super Smash Bros. Melee coach providing live voice coaching during gameplay. ${initialContext}`,
            turn_detection: {
              type: "server_vad",
            },
            input_audio_format: "pcm16",
            output_audio_format: "pcm16",
          },
        })
      );

      setRealtimeConnection(ws);
      resolve(ws);
    };

    ws.onerror = (error) => {
      reject(error);
    };
  });
}

/**
 * End the active Realtime API session
 */
export function endRealtimeSession(): void {
  const ws = realtimeConnection();
  if (ws) {
    ws.close();
    setRealtimeConnection(null);
  }
}

// Export signals
export { apiKey, preferredModel, preferredVoice, realtimeConnection };
