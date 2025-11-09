import { createOptions, Select } from "@thisbeyond/solid-select";
import { createMemo, createSignal, For, Show } from "solid-js";
import { characterNameByExternalId, stageNameByExternalId } from "~/common/ids";
import { Picker } from "~/components/common/Picker";
import { StageBadge } from "~/components/common/Badge";
import { WhiteButton } from "~/components/common/Button";
import { ReplayStub, SelectionStore } from "~/state/selectionStore";
import { reviewNotes, getReviewNoteById, saveReviewNote, deleteReviewNote, createReviewNote } from "~/state/reviewNotesStore";
import { ReviewNotesSection } from "~/components/panels/ReviewNotesSection";
import { ReviewNote } from "~/common/indexedDB";

const filterProps = createOptions(
  [
    ...characterNameByExternalId.map((name) => ({
      type: "character",
      label: name,
    })),
    ...stageNameByExternalId.map((name) => ({ type: "stage", label: name })),
  ],
  {
    key: "label",
    createable: (code) => ({ type: "codeOrName", label: code }),
  }
);
export function Replays(props: { selectionStore: SelectionStore }) {
  const [expandedReplayId, setExpandedReplayId] = createSignal<string | null>(null);
  
  const selectedStub = () => props.selectionStore.data.selectedFileAndStub?.[1];
  const selectedReviewNote = createMemo(() => {
    const stub = selectedStub();
    if (!stub) return undefined;
    return getReviewNoteById(stub.fileName);
  });

  const handleCreateReview = async () => {
    const stub = selectedStub();
    if (!stub) return;

    const playerSettings = stub.playerSettings.filter(Boolean);
    if (playerSettings.length < 2) return;

    const note = createReviewNote(
      stub.fileName,
      stub.fileName,
      playerSettings[0].externalCharacterId,
      playerSettings[1].externalCharacterId,
      stub.stageId,
      stub.playedOn,
      false
    );

    await saveReviewNote(note);
    setExpandedReplayId(stub.fileName);
  };

  const handleSaveReview = async (note: ReviewNote) => {
    await saveReviewNote(note);
  };

  const handleDeleteReview = async () => {
    const stub = selectedStub();
    if (!stub) return;
    await deleteReviewNote(stub.fileName);
    setExpandedReplayId(null);
  };

  return (
    <>
      <div class="flex max-h-96 w-full flex-col items-center gap-2 overflow-y-auto sm:h-full md:max-h-screen">
        <div
          class="w-full"
          // don't trigger global shortcuts when typing in the filter box
          onkeydown={(e: Event) => e.stopPropagation()}
          onkeyup={(e: Event) => e.stopPropagation()}
        >
          <Select
            class="w-full rounded border border-slate-600 bg-white"
            placeholder="Filter"
            multiple
            {...filterProps}
            initialValue={props.selectionStore.data.filters}
            onChange={props.selectionStore.setFilters}
          />
        </div>
        
        {/* Selected replay review section */}
        <Show when={selectedStub()}>
          <div class="w-full border-b border-slate-300 pb-2">
            <Show when={selectedReviewNote()}>
              <ReviewNotesSection
                note={selectedReviewNote()!}
                onSave={handleSaveReview}
                onDelete={handleDeleteReview}
              />
            </Show>
            <Show when={!selectedReviewNote()}>
              <div class="flex justify-center p-2">
                <WhiteButton onClick={handleCreateReview}>
                  Add Review Notes
                </WhiteButton>
              </div>
            </Show>
          </div>
        </Show>

        <Show
          when={props.selectionStore.data.filteredStubs.length > 0}
          fallback={<div>No matching results</div>}
        >
          <Picker
            items={props.selectionStore.data.filteredStubs}
            render={(stub) => <GameInfo replayStub={stub} />}
            onClick={(fileAndSettings) =>
              props.selectionStore.select(fileAndSettings)
            }
            selected={(stub) =>
              props.selectionStore.data.selectedFileAndStub?.[1] === stub
            }
            estimateSize={(stub) =>
              stub.playerSettings.filter(Boolean).length === 4 ? 56 : 32
            }
          />
        </Show>
      </div>
    </>
  );
}

function GameInfo(props: { replayStub: ReplayStub }) {
  function playerString(player: ReplayStub["playerSettings"][0]): string {
    const name = [player.displayName, player.connectCode, player.nametag].find(
      (s) => s?.length > 0
    );
    const character = characterNameByExternalId[player.externalCharacterId];
    return name !== undefined ? `${name}(${character})` : character;
  }

  const teams = createMemo(() => {
    const teams: ReplayStub["playerSettings"][0][][] = [[], [], []];
    props.replayStub.playerSettings
      .filter(Boolean)
      .forEach((player) => teams[player.teamId ?? 0].push(player));
    return teams.filter((team) => team.length > 0);
  });

  // Check if this replay has a review note
  const hasReview = createMemo(() => {
    const notes = reviewNotes();
    return notes.has(props.replayStub.fileName);
  });

  const reviewNote = createMemo(() => {
    const notes = reviewNotes();
    return notes.get(props.replayStub.fileName);
  });

  return (
    <>
      <div class="flex w-full items-center">
        <StageBadge stageId={props.replayStub.stageId} />
        <div class="flex flex-grow flex-col items-center">
          {props.replayStub.playerSettings.filter(Boolean).length === 4 ? (
            <For each={teams()}>
              {(team) => <div>{team.map(playerString).join(" + ")}</div>}
            </For>
          ) : (
            props.replayStub.playerSettings
              .filter((s) => s)
              .map(playerString)
              .join(" vs ")
          )}
        </div>
        <div class="ml-2 flex gap-1">
          <Show when={hasReview()}>
            <span 
              class="text-sm"
              title={reviewNote()?.isAiGenerated ? "AI-assisted review" : "Manual review"}
            >
              {reviewNote()?.isAiGenerated ? "🤖" : "✓"}
            </span>
          </Show>
        </div>
      </div>
    </>
  );
}
