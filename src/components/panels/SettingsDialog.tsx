import { createEffect, createSignal, Show } from "solid-js";
import { PrimaryButton, WhiteButton } from "~/components/common/Button";
import { Dialog } from "~/components/common/Dialog";
import { KeyboardIcon } from "~/components/common/icons";
import {
  apiKey,
  preferredModel,
  preferredVoice,
  setApiKey,
  setPreferredModel,
  setPreferredVoice,
  validateApiKey,
} from "~/state/aiStore";

export function SettingsDialog() {
  return (
    <div class="h-8 w-8">
      <Dialog>
        <Dialog.Trigger>
          <button class="h-8 w-8">
            <KeyboardIcon title="Settings" />
          </button>
        </Dialog.Trigger>
        <Dialog.Title>
          <div class="text-lg font-semibold">Settings</div>
        </Dialog.Title>
        <Dialog.Contents>
          <Settings />
        </Dialog.Contents>
      </Dialog>
    </div>
  );
}

function Settings() {
  const [formApiKey, setFormApiKey] = createSignal(apiKey());
  const [formModel, setFormModel] = createSignal(preferredModel());
  const [formVoice, setFormVoice] = createSignal(preferredVoice());
  const [status, setStatus] = createSignal<
    "idle" | "validating" | "success" | "error"
  >("idle");
  const [statusMessage, setStatusMessage] = createSignal<string>("");

  createEffect(() => setFormApiKey(apiKey()));
  createEffect(() => setFormModel(preferredModel()));
  createEffect(() => setFormVoice(preferredVoice()));

  const models = [
    { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
    { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
  ];
  const voices = [
    { value: "alloy", label: "Alloy" },
    { value: "echo", label: "Echo" },
    { value: "fable", label: "Fable" },
  ];

  async function handleSave(event: Event) {
    event.preventDefault();
    const trimmedKey = formApiKey().trim();
    if (trimmedKey.length > 0) {
      setStatus("validating");
      setStatusMessage("Validating API key…");
      const isValid = await validateApiKey(trimmedKey);
      if (!isValid) {
        setStatus("error");
        setStatusMessage(
          "Invalid API key. Please double-check your key and try again."
        );
        return;
      }
    }

    setApiKey(trimmedKey);
    setPreferredModel(formModel());
    setPreferredVoice(formVoice());
    setStatus("success");
    setStatusMessage(
      trimmedKey.length > 0
        ? "API key validated and saved."
        : "Preferences saved. AI features remain disabled without an API key."
    );
  }

  return (
    <form onSubmit={handleSave} class="flex flex-col gap-6">
      <section class="flex flex-col gap-3">
        <div>
          <h2 class="text-base font-semibold text-slate-800">AI Settings</h2>
          <p class="text-sm text-slate-500">
            Provide your personal OpenAI API key. It is stored locally in your
            browser. Never share this key with others.
          </p>
        </div>
        <label class="flex flex-col gap-2 text-sm font-medium text-slate-700">
          API Key
          <input
            type="password"
            value={formApiKey()}
            onInput={(event) => setFormApiKey(event.currentTarget.value ?? "")}
            autocomplete="off"
            placeholder="sk-..."
            class="w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slippi-400 focus:outline-none focus:ring-2 focus:ring-slippi-300"
          />
        </label>
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
          <label class="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Preferred Model
            <select
              value={formModel()}
              onChange={(event) => setFormModel(event.currentTarget.value)}
              class="rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slippi-400 focus:outline-none focus:ring-2 focus:ring-slippi-300"
            >
              {models.map((model) => (
                <option value={model.value}>{model.label}</option>
              ))}
            </select>
          </label>
          <label class="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Preferred Voice
            <select
              value={formVoice()}
              onChange={(event) => setFormVoice(event.currentTarget.value)}
              class="rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slippi-400 focus:outline-none focus:ring-2 focus:ring-slippi-300"
            >
              {voices.map((voice) => (
                <option value={voice.value}>{voice.label}</option>
              ))}
            </select>
          </label>
        </div>
        <Show when={status() !== "idle"}>
          <div
            classList={{
              "text-sm font-medium": true,
              "text-slate-600": status() === "validating",
              "text-green-600": status() === "success",
              "text-red-600": status() === "error",
            }}
          >
            {statusMessage()}
          </div>
        </Show>
      </section>
      <section class="flex flex-col gap-3">
        <h2 class="text-base font-semibold text-slate-800">
          Playback Shortcuts
        </h2>
        <div class="max-h-48 overflow-y-auto rounded border border-slate-200">
          <table class="w-full border-collapse text-left text-sm">
            <thead class="bg-slate-100 text-xs uppercase text-slate-600">
              <tr>
                <th class="px-3 py-2">Shortcut</th>
                <th class="px-3 py-2">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr class="odd:bg-white even:bg-slate-50">
                <td class="px-3 py-2">
                  <kbd class="rounded border border-slate-400 bg-slate-50 px-1">
                    space
                  </kbd>
                  /
                  <kbd class="rounded border border-slate-400 bg-slate-50 px-1">
                    K
                  </kbd>
                </td>
                <td class="px-3 py-2">Toggle pause</td>
              </tr>
              <tr class="odd:bg-white even:bg-slate-50">
                <td class="px-3 py-2">
                  <kbd class="rounded border border-slate-400 bg-slate-50 px-1">
                    F
                  </kbd>
                </td>
                <td class="px-3 py-2">Toggle fullscreen</td>
              </tr>
              <tr class="odd:bg-white even:bg-slate-50">
                <td class="px-3 py-2">
                  <kbd class="rounded border border-slate-400 bg-slate-50 px-1">
                    LeftArrow
                  </kbd>
                  /
                  <kbd class="rounded border border-slate-400 bg-slate-50 px-1">
                    J
                  </kbd>
                </td>
                <td class="px-3 py-2">Rewind 2 seconds</td>
              </tr>
              <tr class="odd:bg-white even:bg-slate-50">
                <td class="px-3 py-2">
                  <kbd class="rounded border border-slate-400 bg-slate-50 px-1">
                    RightArrow
                  </kbd>
                  /
                  <kbd class="rounded border border-slate-400 bg-slate-50 px-1">
                    L
                  </kbd>
                </td>
                <td class="px-3 py-2">Skip ahead 2 seconds</td>
              </tr>
              <tr class="odd:bg-white even:bg-slate-50">
                <td class="px-3 py-2">
                  <kbd class="rounded border border-slate-400 bg-slate-50 px-1">
                    0
                  </kbd>
                  -
                  <kbd class="rounded border border-slate-400 bg-slate-50 px-1">
                    9
                  </kbd>
                </td>
                <td class="px-3 py-2">
                  Jump to xx%. For example, press{" "}
                  <kbd class="rounded border border-slate-400 bg-slate-50 px-1">
                    3
                  </kbd>{" "}
                  for 30%
                </td>
              </tr>
              <tr class="odd:bg-white even:bg-slate-50">
                <td class="px-3 py-2">
                  <kbd class="rounded border border-slate-400 bg-slate-50 px-1">
                    .
                  </kbd>
                </td>
                <td class="px-3 py-2">Next frame (pauses if not paused)</td>
              </tr>
              <tr class="odd:bg-white even:bg-slate-50">
                <td class="px-3 py-2">
                  <kbd class="rounded border border-slate-400 bg-slate-50 px-1">
                    ,
                  </kbd>
                </td>
                <td class="px-3 py-2">Previous frame (pauses if not paused)</td>
              </tr>
              <tr class="odd:bg-white even:bg-slate-50">
                <td class="px-3 py-2">
                  <kbd class="rounded border border-slate-400 bg-slate-50 px-1">
                    UpArrow
                  </kbd>
                </td>
                <td class="px-3 py-2">Slow speed</td>
              </tr>
              <tr class="odd:bg-white even:bg-slate-50">
                <td class="px-3 py-2">
                  <kbd class="rounded border border-slate-400 bg-slate-50 px-1">
                    DownArrow
                  </kbd>
                </td>
                <td class="px-3 py-2">Fast speed</td>
              </tr>
              <tr class="odd:bg-white even:bg-slate-50">
                <td class="px-3 py-2">
                  <kbd class="rounded border border-slate-400 bg-slate-50 px-1">
                    +
                  </kbd>
                  /
                  <kbd class="rounded border border-slate-400 bg-slate-50 px-1">
                    =
                  </kbd>
                </td>
                <td class="px-3 py-2">Zoom in</td>
              </tr>
              <tr class="odd:bg-white even:bg-slate-50">
                <td class="px-3 py-2">
                  <kbd class="rounded border border-slate-400 bg-slate-50 px-1">
                    -
                  </kbd>
                  /
                  <kbd class="rounded border border-slate-400 bg-slate-50 px-1">
                    _
                  </kbd>
                </td>
                <td class="px-3 py-2">Zoom out</td>
              </tr>
              <tr class="odd:bg-white even:bg-slate-50">
                <td class="px-3 py-2">
                  <kbd class="rounded border border-slate-400 bg-slate-50 px-1">
                    [
                  </kbd>
                  /
                  <kbd class="rounded border border-slate-400 bg-slate-50 px-1">
                    {"{"}
                  </kbd>
                </td>
                <td class="px-3 py-2">Play previous file</td>
              </tr>
              <tr class="odd:bg-white even:bg-slate-50">
                <td class="px-3 py-2">
                  <kbd class="rounded border border-slate-400 bg-slate-50 px-1">
                    ]
                  </kbd>
                  /
                  <kbd class="rounded border border-slate-400 bg-slate-50 px-1">
                    {"}"}
                  </kbd>
                </td>
                <td class="px-3 py-2">Play next file</td>
              </tr>
              <tr class="odd:bg-white even:bg-slate-50">
                <td class="px-3 py-2">
                  <kbd class="rounded border border-slate-400 bg-slate-50 px-1">
                    ;
                  </kbd>
                  /
                  <kbd class="rounded border border-slate-400 bg-slate-50 px-1">
                    :
                  </kbd>
                </td>
                <td class="px-3 py-2">Play previous clip</td>
              </tr>
              <tr class="odd:bg-white even:bg-slate-50">
                <td class="px-3 py-2">
                  <kbd class="rounded border border-slate-400 bg-slate-50 px-1">
                    '
                  </kbd>
                  /
                  <kbd class="rounded border border-slate-400 bg-slate-50 px-1">
                    "
                  </kbd>
                </td>
                <td class="px-3 py-2">Play next clip</td>
              </tr>
              <tr class="odd:bg-white even:bg-slate-50">
                <td class="px-3 py-2">
                  <kbd class="rounded border border-slate-400 bg-slate-50 px-1">
                    D
                  </kbd>
                </td>
                <td class="px-3 py-2">
                  Toggle debug output (un-normalizes frame#)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      <div class="flex w-full justify-end gap-3 border-t border-slate-200 pt-4">
        <Dialog.Close>
          <WhiteButton type="button">Close</WhiteButton>
        </Dialog.Close>
        <PrimaryButton
          type="submit"
          class="disabled:cursor-not-allowed disabled:opacity-50"
          disabled={status() === "validating"}
        >
          {status() === "validating" ? "Saving…" : "Save"}
        </PrimaryButton>
      </div>
    </form>
  );
}
