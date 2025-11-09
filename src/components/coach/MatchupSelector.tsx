import { For } from "solid-js";
import { characterNameByExternalId, ExternalCharacterName } from "~/common/ids";
import { matchup, setMatchup } from "~/state/coachStore";

export function MatchupSelector() {
  const characters = characterNameByExternalId.map((name, id) => ({
    id,
    name,
  }));

  function handleChangePlayer(event: Event) {
    const value = Number((event.target as HTMLSelectElement).value);
    setMatchup(value, matchup().opponent);
  }

  function handleChangeOpponent(event: Event) {
    const value = Number((event.target as HTMLSelectElement).value);
    setMatchup(matchup().player, value);
  }

  return (
    <div class="rounded border border-slate-200 bg-slate-50 p-4">
      <h3 class="text-sm font-semibold text-slate-700">Matchup</h3>
      <div class="mt-3 grid gap-3 sm:grid-cols-2">
        <label class="flex flex-col gap-2 text-sm text-slate-600">
          Your Character
          <select
            class="rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slippi-400 focus:outline-none focus:ring-2 focus:ring-slippi-300"
            value={matchup().player}
            onChange={handleChangePlayer}
          >
            <CharacterOptions characters={characters} />
          </select>
        </label>
        <label class="flex flex-col gap-2 text-sm text-slate-600">
          Opponent
          <select
            class="rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slippi-400 focus:outline-none focus:ring-2 focus:ring-slippi-300"
            value={matchup().opponent}
            onChange={handleChangeOpponent}
          >
            <CharacterOptions characters={characters} />
          </select>
        </label>
      </div>
    </div>
  );
}

function CharacterOptions(props: {
  characters: { id: number; name: ExternalCharacterName }[];
}) {
  return (
    <For each={props.characters}>
      {(character) => <option value={character.id}>{character.name}</option>}
    </For>
  );
}
