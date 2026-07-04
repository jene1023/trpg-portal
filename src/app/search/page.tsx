"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { supabase, isSupabaseConfigured, Character, Npc, Scenario, SessionLog, QuickNote, ScenarioNote, Tag } from "@/lib/supabase";

type SessionResult = SessionLog & { characters: { name: string } | null };
type QuickNoteResult = QuickNote & { characters: { name: string } | null };
type ScenarioNoteResult = ScenarioNote & { scenarios: { title: string } | null };

function SearchPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";

  const [inputValue, setInputValue] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [npcs, setNpcs] = useState<Npc[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [sessions, setSessions] = useState<SessionResult[]>([]);
  const [quickNotes, setQuickNotes] = useState<QuickNoteResult[]>([]);
  const [scenarioNotes, setScenarioNotes] = useState<ScenarioNoteResult[]>([]);

  useEffect(() => {
    setInputValue(initialQuery);
    if (!initialQuery) {
      setCharacters([]);
      setNpcs([]);
      setScenarios([]);
      setSessions([]);
      setQuickNotes([]);
      setScenarioNotes([]);
      setSearched(false);
      return;
    }
    if (!isSupabaseConfigured) {
      setSearched(true);
      return;
    }
    async function runSearch(q: string) {
      setLoading(true);
      const [
        { data: charactersData },
        { data: npcsData },
        { data: scenariosData },
        { data: sessionsData },
        { data: quickNotesData },
        { data: scenarioNotesData },
        { data: matchingTagsData },
      ] = await Promise.all([
        supabase.from("characters").select("*").ilike("name", `%${q}%`),
        supabase.from("npcs").select("*").ilike("name", `%${q}%`),
        supabase.from("scenarios").select("*").ilike("title", `%${q}%`),
        supabase.from("sessions").select("*, characters(name)").ilike("summary", `%${q}%`),
        supabase.from("quick_notes").select("*, characters(name)").ilike("content", `%${q}%`),
        supabase.from("scenario_notes").select("*, scenarios(title)").ilike("content", `%${q}%`),
        supabase.from("tags").select("id, name").ilike("name", `%${q}%`),
      ]);

      let mergedChars = (charactersData as Character[]) ?? [];
      let mergedNpcs = (npcsData as Npc[]) ?? [];
      let mergedScenarios = (scenariosData as Scenario[]) ?? [];

      // Tag-based search: find entities tagged with matching tags
      if (matchingTagsData && (matchingTagsData as Tag[]).length > 0) {
        const tagIds = (matchingTagsData as Tag[]).map((t) => t.id);
        const { data: entityTagsData } = await supabase
          .from("entity_tags")
          .select("entity_type, entity_id")
          .in("tag_id", tagIds);

        if (entityTagsData) {
          const charIds = [
            ...new Set(
              entityTagsData
                .filter((e) => e.entity_type === "character")
                .map((e) => e.entity_id)
            ),
          ];
          const npcIds = [
            ...new Set(
              entityTagsData
                .filter((e) => e.entity_type === "npc")
                .map((e) => e.entity_id)
            ),
          ];
          const scenarioIds = [
            ...new Set(
              entityTagsData
                .filter((e) => e.entity_type === "scenario")
                .map((e) => e.entity_id)
            ),
          ];

          const existingCharIds = new Set(mergedChars.map((c) => c.id));
          const existingNpcIds = new Set(mergedNpcs.map((n) => n.id));
          const existingScenarioIds = new Set(mergedScenarios.map((s) => s.id));

          const newCharIds = charIds.filter((id) => !existingCharIds.has(id));
          const newNpcIds = npcIds.filter((id) => !existingNpcIds.has(id));
          const newScenarioIds = scenarioIds.filter((id) => !existingScenarioIds.has(id));

          const [tcRes, tnRes, tsRes] = await Promise.all([
            newCharIds.length
              ? supabase.from("characters").select("*").in("id", newCharIds)
              : Promise.resolve({ data: [] }),
            newNpcIds.length
              ? supabase.from("npcs").select("*").in("id", newNpcIds)
              : Promise.resolve({ data: [] }),
            newScenarioIds.length
              ? supabase.from("scenarios").select("*").in("id", newScenarioIds)
              : Promise.resolve({ data: [] }),
          ]);

          mergedChars = [...mergedChars, ...((tcRes.data as Character[]) ?? [])];
          mergedNpcs = [...mergedNpcs, ...((tnRes.data as Npc[]) ?? [])];
          mergedScenarios = [...mergedScenarios, ...((tsRes.data as Scenario[]) ?? [])];
        }
      }

      setCharacters(mergedChars);
      setNpcs(mergedNpcs);
      setScenarios(mergedScenarios);
      setSessions((sessionsData as SessionResult[]) ?? []);
      setQuickNotes((quickNotesData as QuickNoteResult[]) ?? []);
      setScenarioNotes((scenarioNotesData as ScenarioNoteResult[]) ?? []);
      setLoading(false);
      setSearched(true);
    }
    runSearch(initialQuery);
  }, [initialQuery]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  }

  const totalResults =
    characters.length + npcs.length + scenarios.length + sessions.length + quickNotes.length + scenarioNotes.length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-cinzel text-2xl font-bold text-coc-text mb-6">横断検索</h1>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-coc-muted pointer-events-none" />
          <input
            type="text"
            placeholder="キャラクター・NPC・シナリオ・ログ・メモを検索..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full rounded-lg border border-coc-border bg-coc-surface pl-9 pr-3 py-2.5 text-sm text-coc-text placeholder-coc-muted focus:outline-none focus:border-coc-gold transition-colors"
            autoFocus
          />
        </div>
      </form>

      {loading && (
        <div className="flex justify-center items-center py-24 text-coc-muted font-crimson text-lg italic animate-pulse">
          異界を検索しています...
        </div>
      )}

      {!loading && !initialQuery && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <span className="text-5xl text-coc-faint select-none">✦</span>
          <p className="text-coc-muted font-crimson text-lg italic text-center">
            キーワードを入力して検索してください。
          </p>
        </div>
      )}

      {!loading && searched && initialQuery && totalResults === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <span className="text-5xl text-coc-faint select-none">✦</span>
          <p className="text-coc-muted font-crimson text-lg italic text-center">
            「{initialQuery}」に一致する結果が見つかりませんでした。
          </p>
        </div>
      )}

      {!loading && totalResults > 0 && (
        <div className="flex flex-col gap-8">
          {characters.length > 0 && (
            <section>
              <h2 className="font-cinzel text-sm font-semibold text-coc-gold mb-3">
                キャラクター ({characters.length})
              </h2>
              <div className="flex flex-col gap-2">
                {characters.map((c) => (
                  <Link
                    key={c.id}
                    href={`/characters/${c.id}`}
                    className="rounded-lg border border-coc-border bg-coc-surface px-4 py-3 hover:border-coc-gold-dim transition-colors"
                  >
                    <p className="text-sm font-medium text-coc-text">{c.name}</p>
                    {c.occupation && (
                      <p className="text-xs text-coc-muted mt-0.5">{c.occupation}</p>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {npcs.length > 0 && (
            <section>
              <h2 className="font-cinzel text-sm font-semibold text-coc-gold mb-3">
                NPC ({npcs.length})
              </h2>
              <div className="flex flex-col gap-2">
                {npcs.map((n) => (
                  <Link
                    key={n.id}
                    href={`/npcs/${n.id}`}
                    className="rounded-lg border border-coc-border bg-coc-surface px-4 py-3 hover:border-coc-gold-dim transition-colors"
                  >
                    <p className="text-sm font-medium text-coc-text">{n.name}</p>
                    {n.scenario_name && (
                      <p className="text-xs text-coc-muted mt-0.5">{n.scenario_name}</p>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {scenarios.length > 0 && (
            <section>
              <h2 className="font-cinzel text-sm font-semibold text-coc-gold mb-3">
                シナリオ ({scenarios.length})
              </h2>
              <div className="flex flex-col gap-2">
                {scenarios.map((s) => (
                  <Link
                    key={s.id}
                    href={`/scenarios/${s.id}`}
                    className="rounded-lg border border-coc-border bg-coc-surface px-4 py-3 hover:border-coc-gold-dim transition-colors"
                  >
                    <p className="text-sm font-medium text-coc-text">{s.title}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {sessions.length > 0 && (
            <section>
              <h2 className="font-cinzel text-sm font-semibold text-coc-gold mb-3">
                セッションログ ({sessions.length})
              </h2>
              <div className="flex flex-col gap-2">
                {sessions.map((s) => (
                  <Link
                    key={s.id}
                    href={`/characters/${s.character_id}/sessions`}
                    className="rounded-lg border border-coc-border bg-coc-surface px-4 py-3 hover:border-coc-gold-dim transition-colors"
                  >
                    <p className="text-sm font-medium text-coc-text">{s.title}</p>
                    <p className="text-xs text-coc-muted mt-0.5">
                      {s.characters?.name ?? "不明なキャラクター"}
                    </p>
                    {s.summary && (
                      <p className="text-xs text-coc-muted mt-1 line-clamp-2">{s.summary}</p>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {(quickNotes.length > 0 || scenarioNotes.length > 0) && (
            <section>
              <h2 className="font-cinzel text-sm font-semibold text-coc-gold mb-3">
                メモ ({quickNotes.length + scenarioNotes.length})
              </h2>
              <div className="flex flex-col gap-2">
                {quickNotes.map((n) => (
                  <Link
                    key={`quick-${n.id}`}
                    href={`/characters/${n.character_id}/quick-notes`}
                    className="rounded-lg border border-coc-border bg-coc-surface px-4 py-3 hover:border-coc-gold-dim transition-colors"
                  >
                    <p className="text-xs text-coc-muted mb-0.5">
                      {n.characters?.name ?? "不明なキャラクター"}のクイックメモ
                    </p>
                    <p className="text-sm text-coc-text line-clamp-2">{n.content}</p>
                  </Link>
                ))}
                {scenarioNotes.map((n) => (
                  <Link
                    key={`scenario-note-${n.id}`}
                    href={`/scenarios/${n.scenario_id}/notes`}
                    className="rounded-lg border border-coc-border bg-coc-surface px-4 py-3 hover:border-coc-gold-dim transition-colors"
                  >
                    <p className="text-xs text-coc-muted mb-0.5">
                      {n.scenarios?.title ?? "不明なシナリオ"}の共有メモ
                    </p>
                    <p className="text-sm text-coc-text line-clamp-2">{n.content}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-16 text-sm text-coc-muted">読み込み中...</div>}>
      <SearchPageInner />
    </Suspense>
  );
}
