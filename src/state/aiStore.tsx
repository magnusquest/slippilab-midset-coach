import { Accessor, createSignal } from "solid-js";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const API_KEY_STORAGE_KEY = "midset-coach:openai-api-key";
const MODEL_STORAGE_KEY = "midset-coach:openai-model";
const VOICE_STORAGE_KEY = "midset-coach:openai-voice";

const DEFAULT_MODEL = "gpt-4-turbo";
const DEFAULT_VOICE = "alloy";
const REALTIME_MODEL = "gpt-4o-realtime-preview";

function readLocalStorage(key: string): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    console.warn(`Unable to read ${key} from localStorage`, error);
    return null;
  }
}

function writeLocalStorage(key: string, value: string | null): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    if (value === null) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, value);
    }
  } catch (error) {
    console.warn(`Unable to write ${key} to localStorage`, error);
  }
}

const [apiKeySignal, setApiKeySignal] = createSignal(
  readLocalStorage(API_KEY_STORAGE_KEY) ?? ""
);
const [preferredModelSignal, setPreferredModelSignal] = createSignal(
  readLocalStorage(MODEL_STORAGE_KEY) ?? DEFAULT_MODEL
);
const [preferredVoiceSignal, setPreferredVoiceSignal] = createSignal(
  readLocalStorage(VOICE_STORAGE_KEY) ?? DEFAULT_VOICE
);
const [realtimeConnectionSignal, setRealtimeConnectionSignal] =
  createSignal<WebSocket | null>(null);

export const apiKey: Accessor<string> = apiKeySignal;
export const preferredModel: Accessor<string> = preferredModelSignal;
export const preferredVoice: Accessor<string> = preferredVoiceSignal;
export const realtimeConnection: Accessor<WebSocket | null> =
  realtimeConnectionSignal;

export function setApiKey(value: string): void {
  setApiKeySignal(value);
  writeLocalStorage(API_KEY_STORAGE_KEY, value.length > 0 ? value : null);
}

export function setPreferredModel(value: string): void {
  setPreferredModelSignal(value);
  writeLocalStorage(MODEL_STORAGE_KEY, value);
}

export function setPreferredVoice(value: string): void {
  setPreferredVoiceSignal(value);
  writeLocalStorage(VOICE_STORAGE_KEY, value);
}

function buildAuthHeaders(): Record<string, string> {
  const key = apiKeySignal();
  if (!key) {
    throw new Error("OpenAI API key is not set.");
  }
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

export async function sendChatMessage(
  messages: ChatMessage[]
): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      ...buildAuthHeaders(),
    },
    body: JSON.stringify({
      model: preferredModelSignal(),
      messages,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Chat completion failed: ${response.status} ${response.statusText} - ${text}`
    );
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Chat completion response did not contain any content.");
  }
  return content;
}

interface RealtimeSessionResponse {
  id: string;
  model: string;
  client_secret: {
    value: string;
    expires_at: number;
  };
}

export async function startRealtimeSession(
  initialContext: string
): Promise<WebSocket> {
  // Close any existing session before creating a new one.
  endRealtimeSession();

  const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
    method: "POST",
    headers: buildAuthHeaders(),
    body: JSON.stringify({
      model: REALTIME_MODEL,
      voice: preferredVoiceSignal(),
      instructions: initialContext,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Failed to create realtime session: ${response.status} ${response.statusText} - ${text}`
    );
  }

  const session = (await response.json()) as RealtimeSessionResponse;
  const sessionSecret = session.client_secret?.value;
  if (!sessionSecret) {
    throw new Error("Realtime session did not include a client secret.");
  }

  const url = new URL("wss://api.openai.com/v1/realtime");
  url.searchParams.set("model", session.model ?? REALTIME_MODEL);
  url.searchParams.set("session_secret", sessionSecret);

  const socket = new WebSocket(url.toString(), ["realtime.v1"]);
  setRealtimeConnectionSignal(socket);
  return socket;
}

export function endRealtimeSession(): void {
  const existing = realtimeConnectionSignal();
  if (existing !== null) {
    existing.close();
    setRealtimeConnectionSignal(null);
  }
}

export async function validateApiKey(key: string): Promise<boolean> {
  if (!key) {
    return false;
  }
  try {
    const response = await fetch("https://api.openai.com/v1/models?limit=1", {
      headers: {
        Authorization: `Bearer ${key}`,
      },
    });
    if (!response.ok) {
      return false;
    }
    return true;
  } catch (error) {
    console.error("Failed to validate API key", error);
    return false;
  }
}
