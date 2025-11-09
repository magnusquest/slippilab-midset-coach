import { currentSidebar } from "~/state/navigationStore";
import { Switch, Match } from "solid-js";
import { Replays } from "~/components/panels/Replays";
import { Clips } from "~/components/panels/Clips";
import { Inputs } from "~/components/panels/Inputs";
import { cloudLibrary, localLibrary } from "~/state/selectionStore";
import { ReviewNotesSection } from "~/components/panels/ReviewNotesSection";
import { CoachPanel } from "~/components/panels/CoachPanel";

export function Sidebar() {
  return (
    <>
      <div class="hidden h-full w-96 overflow-y-auto py-4 lg:block">
        <Switch>
          <Match when={currentSidebar() === "cloud replays"}>
            <div class="flex h-full flex-col gap-4 pr-4">
              <Replays selectionStore={cloudLibrary} />
              <ReviewNotesSection selectionStore={cloudLibrary} />
            </div>
          </Match>
          <Match when={currentSidebar() === "local replays"}>
            <div class="flex h-full flex-col gap-4 pr-4">
              <Replays selectionStore={localLibrary} />
              <ReviewNotesSection selectionStore={localLibrary} />
            </div>
          </Match>
          <Match when={currentSidebar() === "clips"}>
            <Clips />
          </Match>
          <Match when={currentSidebar() === "inputs"}>
            <Inputs />
          </Match>
          <Match when={currentSidebar() === "coach"}>
            <CoachPanel />
          </Match>
        </Switch>
      </div>
      <div class="flex flex-col gap-6 px-4 lg:hidden">
        <Replays selectionStore={localLibrary} />
        <ReviewNotesSection selectionStore={localLibrary} />
        <Clips />
      </div>
    </>
  );
}
