import { MatchupSelector } from "~/components/coach/MatchupSelector";
import { ContextControls } from "~/components/coach/ContextControls";
import { PreGameChat } from "~/components/coach/PreGameChat";
import { LiveSession } from "~/components/coach/LiveSession";

export function CoachPanel() {
  return (
    <div class="flex h-full flex-col gap-4 overflow-y-auto pr-4">
      <MatchupSelector />
      <ContextControls />
      <PreGameChat />
      <LiveSession />
    </div>
  );
}
