"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { supabase, isSupabaseConfigured, Character, Npc, Scenario } from "@/lib/supabase";

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

  useEffect(() => {
    setInputValue(initialQuery);
    if (!initialQuery) {
      setCharacters([]);
      setNpcs([]);
      setScenarios([]);
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
      ] = await Promise.all([
        supabase.from("characters").select("*").ilike("name", `%${q}%`),
        supabase.from("npcs").select("*").ilike("name", `%${q}%`),
        supabase.from("scenarios").select("*").ilike("title", `%${q}%`),
      ]);
      setCharacters((charactersData as Character[]) ?? []);
      setNpcs((npcsData as Npc[]) ?? []);
      setScenarios((scenariosData as Scenario[]) ?? []);
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

  const totalResults = characters.length + npcs.length + scenarios.length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-cinzel text-2xl font-bold text-coc-text mb-6">横断検索</h1>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-coc-muted pointer-events-none" />
          <input
            type="text"
            placeholder="キャラクター・NPC・シナリオを検索..."
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
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchPageInner />
    </Suspense>
  );
}
