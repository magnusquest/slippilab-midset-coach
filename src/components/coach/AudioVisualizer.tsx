import { Show } from "solid-js";

export function AudioVisualizer(props: { isActive: boolean }) {
  return (
    <div class="flex h-24 items-center justify-center">
      <Show
        when={props.isActive}
        fallback={
          <div class="h-16 w-16 rounded-full border-2 border-dashed border-slate-300" />
        }
      >
        <div class="relative flex h-16 w-16 items-center justify-center">
          <div class="absolute h-16 w-16 animate-ping rounded-full bg-slippi-200 opacity-75" />
          <div class="absolute h-12 w-12 animate-pulse rounded-full bg-slippi-400 opacity-80" />
          <div class="z-10 h-8 w-8 rounded-full bg-slippi-500 shadow-lg" />
        </div>
      </Show>
    </div>
  );
}
