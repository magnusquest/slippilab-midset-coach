import { createSignal } from "solid-js";
import { WhiteButton } from "~/components/common/Button";
import { Dialog } from "~/components/common/Dialog";
import { KeyboardIcon } from "~/components/common/icons";
import {
  apiKey,
  saveApiKey,
  clearApiKey,
  validateApiKey,
  preferredModel,
  savePreferredModel,
  preferredVoice,
  savePreferredVoice,
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
          <div class="text-lg">Settings</div>
        </Dialog.Title>
        <Dialog.Contents>
          <div class="my-5">
            <Settings />
          </div>
          <div class="flex w-full justify-end">
            <Dialog.Close>
              <WhiteButton>Close</WhiteButton>
            </Dialog.Close>
          </div>
        </Dialog.Contents>
      </Dialog>
    </div>
  );
}

function Settings() {
  const [tempApiKey, setTempApiKey] = createSignal(apiKey());
  const [isValidating, setIsValidating] = createSignal(false);
  const [validationMessage, setValidationMessage] = createSignal("");
  const [showApiKey, setShowApiKey] = createSignal(false);

  const handleSaveApiKey = async () => {
    const key = tempApiKey().trim();
    if (!key) {
      clearApiKey();
      setValidationMessage("API key cleared");
      return;
    }

    setIsValidating(true);
    setValidationMessage("Validating...");

    try {
      const isValid = await validateApiKey(key);
      if (isValid) {
        saveApiKey(key);
        setValidationMessage("✓ API key saved successfully");
      } else {
        setValidationMessage("✗ Invalid API key");
      }
    } catch (error) {
      setValidationMessage("✗ Validation failed");
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <>
      {/* AI Configuration Section */}
      <div class="mb-6 border-b pb-4">
        <h3 class="mb-3 text-base font-semibold">AI Coach Configuration</h3>
        
        <div class="mb-4">
          <label class="mb-1 block text-sm font-medium">OpenAI API Key</label>
          <div class="flex gap-2">
            <input
              type={showApiKey() ? "text" : "password"}
              class="flex-1 rounded border border-slate-300 px-3 py-2 text-sm"
              placeholder="sk-..."
              value={tempApiKey()}
              onInput={(e) => setTempApiKey(e.currentTarget.value)}
            />
            <button
              class="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
              onClick={() => setShowApiKey(!showApiKey())}
            >
              {showApiKey() ? "Hide" : "Show"}
            </button>
            <button
              class="rounded bg-slippi-500 px-3 py-2 text-sm text-white hover:bg-slippi-600 disabled:opacity-50"
              onClick={handleSaveApiKey}
              disabled={isValidating()}
            >
              Save
            </button>
          </div>
          {validationMessage() && (
            <p class="mt-1 text-sm text-slate-600">{validationMessage()}</p>
          )}
          <p class="mt-1 text-xs text-slate-500">
            ⚠️ Your API key is stored locally in your browser. Never share it with others.
          </p>
        </div>

        <div class="mb-4">
          <label class="mb-1 block text-sm font-medium">Chat Model</label>
          <select
            class="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            value={preferredModel()}
            onChange={(e) => savePreferredModel(e.currentTarget.value)}
          >
            <option value="gpt-4-turbo">GPT-4 Turbo (Recommended)</option>
            <option value="gpt-4">GPT-4</option>
            <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Faster, cheaper)</option>
          </select>
        </div>

        <div class="mb-4">
          <label class="mb-1 block text-sm font-medium">Voice (Live Coaching)</label>
          <select
            class="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            value={preferredVoice()}
            onChange={(e) => savePreferredVoice(e.currentTarget.value)}
          >
            <option value="alloy">Alloy</option>
            <option value="echo">Echo</option>
            <option value="fable">Fable</option>
            <option value="onyx">Onyx</option>
            <option value="nova">Nova</option>
            <option value="shimmer">Shimmer</option>
          </select>
        </div>
      </div>

      {/* Keyboard Shortcuts Section */}
      <div>
        <h3 class="mb-3 text-base font-semibold">Playback Shortcuts</h3>
        <div class="flex flex-col items-center gap-2 overflow-y-auto">
          <table>
          <thead>
            <tr>
              <th>Shortcut</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <kbd class="rounded border border-slate-400 bg-slate-50 px-1">
                  space
                </kbd>
                /
                <kbd class="rounded border border-slate-400 bg-slate-50 px-1">
                  K
                </kbd>
              </td>
              <td class="pl-3">Toggle pause</td>
            </tr>
            <tr>
              <td>
                <kbd class="rounded border border-slate-400 bg-slate-50 px-1">
                  F
                </kbd>
              </td>
              <td class="pl-3">Toggle fullscreen</td>
            </tr>
            <tr>
              <td>
                <kbd class="rounded border border-slate-400 bg-slate-50 px-1">
                  LeftArrow
                </kbd>
                /
                <kbd class="rounded border border-slate-400 bg-slate-50 px-1">
                  J
                </kbd>
              </td>
              <td class="pl-3">Rewind 2 seconds</td>
            </tr>
            <tr>
              <td>
                <kbd class="rounded border border-slate-400 bg-slate-50 px-1">
                  RightArrow
                </kbd>
                /
                <kbd class="rounded border border-slate-400 bg-slate-50 px-1">
                  L
                </kbd>
              </td>
              <td class="pl-3">Skip ahead 2 seconds</td>
            </tr>

            <tr>
              <td>
                <kbd class="rounded border border-slate-400 bg-slate-50 px-1">
                  0
                </kbd>
                -
                <kbd class="rounded border border-slate-400 bg-slate-50 px-1">
                  9
                </kbd>
              </td>
              <td class="pl-3">
                Jump to xx%. For example, press{" "}
                <kbd class="rounded border border-slate-400 bg-slate-50 px-1">
                  3
                </kbd>{" "}
                for 30%
              </td>
            </tr>
            <tr>
              <td>
                <kbd class="rounded border border-slate-400 bg-slate-50 px-1">
                  .
                </kbd>
              </td>
              <td class="pl-3">Next frame (pauses if not paused)</td>
            </tr>
            <tr>
              <td>
                <kbd class="rounded border border-slate-400 bg-slate-50 px-1">
                  ,
                </kbd>
              </td>
              <td class="pl-3">Previous frame (pauses if not paused)</td>
            </tr>
            <tr>
              <td>
                <kbd class="rounded border border-slate-400 bg-slate-50 px-1">
                  UpArrow
                </kbd>
              </td>
              <td class="pl-3">Slow speed</td>
            </tr>
            <tr>
              <td>
                <kbd class="rounded border border-slate-400 bg-slate-50 px-1">
                  DownArrow
                </kbd>
              </td>
              <td class="pl-3">Fast speed</td>
            </tr>
            <tr>
              <td>
                <kbd class="rounded border border-slate-400 bg-slate-50 px-1">
                  +
                </kbd>
                /
                <kbd class="rounded border border-slate-400 bg-slate-50 px-1">
                  =
                </kbd>
              </td>
              <td class="pl-3">Zoom in</td>
            </tr>
            <tr>
              <td>
                <kbd class="rounded border border-slate-400 bg-slate-50 px-1">
                  -
                </kbd>
                /
                <kbd class="rounded border border-slate-400 bg-slate-50 px-1">
                  _
                </kbd>
              </td>
              <td class="pl-3">Zoom out</td>
            </tr>
            <tr>
              <td>
                <kbd class="rounded border border-slate-400 bg-slate-50 px-1">
                  [
                </kbd>
                /
                <kbd class="rounded border border-slate-400 bg-slate-50 px-1">
                  {"{"}
                </kbd>
              </td>
              <td class="pl-3">Play previous file</td>
            </tr>
            <tr>
              <td>
                <kbd class="rounded border border-slate-400 bg-slate-50 px-1">
                  ]
                </kbd>
                /
                <kbd class="rounded border border-slate-400 bg-slate-50 px-1">
                  {"}"}
                </kbd>
              </td>
              <td class="pl-3">Play next file</td>
            </tr>
            <tr>
              <td>
                <kbd class="rounded border border-slate-400 bg-slate-50 px-1">
                  ;
                </kbd>
                /
                <kbd class="rounded border border-slate-400 bg-slate-50 px-1">
                  :
                </kbd>
              </td>
              <td class="pl-3">Play previous clip</td>
            </tr>
            <tr>
              <td>
                <kbd class="rounded border border-slate-400 bg-slate-50 px-1">
                  '
                </kbd>
                /
                <kbd class="rounded border border-slate-400 bg-slate-50 px-1">
                  "
                </kbd>
              </td>
              <td class="pl-3">Play next clip</td>
            </tr>
            <tr>
              <td>
                <kbd class="rounded border border-slate-400 bg-slate-50 px-1">
                  D
                </kbd>
              </td>
              <td class="pl-3">Toggle debug output (un-normalizes frame#)</td>
            </tr>
          </tbody>
        </table>
      </div>
      </div>
    </>
  );
}
