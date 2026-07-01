"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Search, Plus, Check } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { SPELL_CATALOG, SPELL_CATEGORIES, SpellEntry } from "@/lib/spellCatalog";

export default function SpellCatalogPage() {
  const searchParams = useSearchParams();
  const characterId = searchParams.get("characterId");

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("すべて");
  const [adding, setAdding] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [charName, setCharName] = useState<string | null>(null);
  const addedTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    if (!characterId || !isSupabaseConfigured) return;
    supabase
      .from("characters")
      .select("name")
      .eq("id", characterId)
      .single()
      .then(({ data }) => {
        if (data) setCharName(data.name);
      });
  }, [characterId]);

  const filtered = SPELL_CATALOG.filter((s) => {
    const matchCat = category === "すべて" || s.category === category;
    const q = query.trim().toLowerCase();
    const matchQ =
      !q ||
      s.spell_name.toLowerCase().includes(q) ||
      s.effect.toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  async function addToCharacter(spell: SpellEntry) {
    if (!characterId || !isSupabaseConfigured) return;
    setAdding(spell.spell_name);

    const sanCostNum = spell.san_cost
      ? parseInt(spell.san_cost.split("/")[0]) || null
      : null;

    await supabase.from("character_spells").insert({
      character_id: characterId,
      spell_name: spell.spell_name,
      mp_cost: spell.mp_cost,
      san_cost: sanCostNum,
      casting_time: spell.casting_time,
      effect: spell.effect,
      source_page: null,
    });

    setAdding(null);
    setAdded((prev) => new Set(prev).add(spell.spell_name));

    const prev = addedTimers.current.get(spell.spell_name);
    if (prev) clearTimeout(prev);
    const t = setTimeout(() => {
      setAdded((s) => {
        const next = new Set(s);
        next.delete(spell.spell_name);
        return next;
      });
    }, 2000);
    addedTimers.current.set(spell.spell_name, t);
  }

  const inputClass =
    "rounded-md border border-coc-border bg-coc-void px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:outline-none focus:border-coc-gold";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        {characterId ? (
          <Link
            href={`/characters/${characterId}/spells`}
            className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
          >
            <ArrowLeft size={16} />
            {charName ?? "呪文・魔術"}
          </Link>
        ) : (
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
          >
            <ArrowLeft size={16} />
            ホーム
          </Link>
        )}
      </div>

      <div className="flex items-center gap-2 mb-1">
        <BookOpen size={20} className="text-coc-gold" />
        <h1 className="font-cinzel text-xl font-bold text-coc-text">呪文カタログ</h1>
      </div>
      <p className="text-sm text-coc-muted mb-6">
        CoC 7版の主要呪文一覧。
        {characterId && charName
          ? `「追加」ボタンで ${charName} の呪文リストに登録できます。`
          : "キャラクターに登録するにはキャラクター詳細の呪文ページからアクセスしてください。"}
      </p>

      {/* フィルター */}
      <div className="flex flex-col sm:flex-row gap-2 mb-5">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-coc-muted pointer-events-none"
          />
          <input
            type="text"
            placeholder="呪文名・効果で検索"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`${inputClass} pl-8 w-full`}
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={`${inputClass} sm:w-44`}
        >
          {SPELL_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* 呪文一覧 */}
      {filtered.length === 0 ? (
        <p className="text-sm text-coc-muted text-center py-8">
          該当する呪文が見つかりません。
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((spell) => {
            const isAdding = adding === spell.spell_name;
            const isAdded = added.has(spell.spell_name);
            return (
              <div
                key={spell.spell_name}
                className="rounded-lg border border-coc-border bg-coc-surface p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <h3 className="text-sm font-semibold text-coc-text">
                        {spell.spell_name}
                      </h3>
                      <span className="rounded border border-coc-border px-1.5 py-0.5 text-xs text-coc-muted">
                        {spell.category}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-2">
                      {spell.mp_cost != null && (
                        <span className="rounded border border-blue-800 bg-blue-950/30 px-2 py-0.5 text-xs text-blue-300">
                          MP {spell.mp_cost}
                        </span>
                      )}
                      {spell.san_cost && (
                        <span className="rounded border border-red-800 bg-red-950/30 px-2 py-0.5 text-xs text-red-300">
                          SAN {spell.san_cost}
                        </span>
                      )}
                      {spell.casting_time && (
                        <span className="rounded border border-coc-border bg-coc-void px-2 py-0.5 text-xs text-coc-muted">
                          詠唱: {spell.casting_time}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-coc-muted leading-relaxed">
                      {spell.effect}
                    </p>
                  </div>

                  {characterId && (
                    <button
                      onClick={() => addToCharacter(spell)}
                      disabled={isAdding || isAdded}
                      className={
                        isAdded
                          ? "shrink-0 flex items-center gap-1.5 rounded-lg border border-green-700/40 bg-green-950/10 px-3 py-1.5 text-xs font-medium text-green-300 transition-all"
                          : "shrink-0 flex items-center gap-1.5 rounded-lg border border-coc-border px-3 py-1.5 text-xs font-medium text-coc-muted hover:text-coc-text hover:border-coc-gold transition-all"
                      }
                    >
                      {isAdded ? (
                        <>
                          <Check size={12} />
                          追加済
                        </>
                      ) : (
                        <>
                          <Plus size={12} />
                          {isAdding ? "追加中…" : "追加"}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-coc-muted text-center mt-6">
        {filtered.length} / {SPELL_CATALOG.length} 件表示
      </p>
    </div>
  );
}
