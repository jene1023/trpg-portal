"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Search, Plus, Check } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { CREATURE_CATALOG, CREATURE_CATEGORIES, CreatureEntry } from "@/lib/creatureCatalog";

function CreatureCatalogContent() {
  const searchParams = useSearchParams();
  const scenarioId = searchParams.get("scenarioId");

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("すべて");
  const [adding, setAdding] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [scenarioTitle, setScenarioTitle] = useState<string | null>(null);
  const addedTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    if (!scenarioId || !isSupabaseConfigured) return;
    supabase
      .from("scenarios")
      .select("title")
      .eq("id", scenarioId)
      .single()
      .then(({ data }) => {
        if (data) setScenarioTitle(data.title);
      });
  }, [scenarioId]);

  const filtered = CREATURE_CATALOG.filter((c) => {
    const matchCat = category === "すべて" || c.category === category;
    const q = query.trim().toLowerCase();
    const matchQ =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.mythos_background.toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  async function addToScenario(creature: CreatureEntry) {
    if (!scenarioId || !isSupabaseConfigured) return;
    setAdding(creature.name);

    await supabase.from("creatures").insert({
      scenario_id: scenarioId,
      name: creature.name,
      mythos_background: creature.mythos_background,
      san_loss_success: creature.san_loss_success,
      san_loss_failure: creature.san_loss_failure,
      str: creature.str,
      con: creature.con,
      pow: creature.pow,
      dex: creature.dex,
      siz: creature.siz,
      hp: creature.hp,
      mp: creature.mp,
      armor: creature.armor,
      attacks: creature.attacks,
      can_use_spells: creature.can_use_spells,
      notes: creature.notes,
    });

    setAdding(null);
    setAdded((prev) => new Set(prev).add(creature.name));

    const prev = addedTimers.current.get(creature.name);
    if (prev) clearTimeout(prev);
    const t = setTimeout(() => {
      setAdded((s) => {
        const next = new Set(s);
        next.delete(creature.name);
        return next;
      });
    }, 2000);
    addedTimers.current.set(creature.name, t);
  }

  const inputClass =
    "rounded-md border border-coc-border bg-coc-void px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:outline-none focus:border-coc-gold";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        {scenarioId ? (
          <Link
            href={`/creatures?scenario=${scenarioId}`}
            className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
          >
            <ArrowLeft size={16} />
            {scenarioTitle ?? "クリーチャー一覧"}
          </Link>
        ) : (
          <Link
            href="/creatures"
            className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
          >
            <ArrowLeft size={16} />
            クリーチャー一覧
          </Link>
        )}
      </div>

      <div className="flex items-center gap-2 mb-1">
        <BookOpen size={20} className="text-coc-gold" />
        <h1 className="font-cinzel text-xl font-bold text-coc-text">神話生物カタログ</h1>
      </div>
      <p className="text-sm text-coc-muted mb-6">
        CoC 7版の代表的な神話生物一覧。
        {scenarioId && scenarioTitle
          ? `「追加」ボタンで「${scenarioTitle}」のクリーチャーとして登録できます。`
          : "シナリオに登録するにはクリーチャー一覧ページのカタログリンクからアクセスしてください。"}
      </p>

      <div className="flex flex-col sm:flex-row gap-2 mb-5">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-coc-muted pointer-events-none"
          />
          <input
            type="text"
            placeholder="名前・背景で検索"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`${inputClass} pl-8 w-full`}
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={`${inputClass} sm:w-40`}
        >
          {CREATURE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-coc-muted text-center py-8">
          該当する神話生物が見つかりません。
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((creature) => {
            const isAdding = adding === creature.name;
            const isAdded = added.has(creature.name);
            return (
              <div
                key={creature.name}
                className="rounded-lg border border-coc-border bg-coc-surface p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <h3 className="text-sm font-semibold text-coc-text">
                        {creature.name}
                      </h3>
                      <span className="rounded border border-coc-border px-1.5 py-0.5 text-xs text-coc-muted">
                        {creature.category}
                      </span>
                      {creature.can_use_spells && (
                        <span className="rounded border border-purple-800 px-1.5 py-0.5 text-xs text-purple-400">
                          呪文使用可
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className="rounded border border-red-800 bg-red-950/30 px-2 py-0.5 text-xs text-red-300">
                        SAN {creature.san_loss_success}/{creature.san_loss_failure}
                      </span>
                      {creature.hp !== null && (
                        <span className="rounded border border-green-800 bg-green-950/30 px-2 py-0.5 text-xs text-green-300">
                          HP {creature.hp}
                        </span>
                      )}
                      {creature.mp !== null && (
                        <span className="rounded border border-blue-800 bg-blue-950/30 px-2 py-0.5 text-xs text-blue-300">
                          MP {creature.mp}
                        </span>
                      )}
                      {creature.armor && (
                        <span className="rounded border border-coc-border bg-coc-void px-2 py-0.5 text-xs text-coc-muted">
                          装甲: {creature.armor}
                        </span>
                      )}
                    </div>

                    {/* 能力値 */}
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mb-2">
                      {creature.str !== null && (
                        <span className="text-xs text-coc-muted">
                          STR <span className="text-coc-text font-medium">{creature.str}</span>
                        </span>
                      )}
                      {creature.con !== null && (
                        <span className="text-xs text-coc-muted">
                          CON <span className="text-coc-text font-medium">{creature.con}</span>
                        </span>
                      )}
                      {creature.pow !== null && (
                        <span className="text-xs text-coc-muted">
                          POW <span className="text-coc-text font-medium">{creature.pow}</span>
                        </span>
                      )}
                      {creature.dex !== null && (
                        <span className="text-xs text-coc-muted">
                          DEX <span className="text-coc-text font-medium">{creature.dex}</span>
                        </span>
                      )}
                      {creature.siz !== null && (
                        <span className="text-xs text-coc-muted">
                          SIZ <span className="text-coc-text font-medium">{creature.siz}</span>
                        </span>
                      )}
                    </div>

                    {creature.attacks && (
                      <p className="text-xs text-coc-muted leading-relaxed mb-1">
                        <span className="text-coc-text/70">攻撃:</span> {creature.attacks}
                      </p>
                    )}

                    <p className="text-xs text-coc-muted leading-relaxed">
                      {creature.mythos_background}
                    </p>

                    {creature.notes && (
                      <p className="text-xs text-coc-gold/70 leading-relaxed mt-1">
                        ※ {creature.notes}
                      </p>
                    )}
                  </div>

                  {scenarioId && (
                    <button
                      onClick={() => addToScenario(creature)}
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
        {filtered.length} / {CREATURE_CATALOG.length} 件表示
      </p>
    </div>
  );
}

export default function CreatureCatalogPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl px-4 py-8 text-coc-muted text-sm">読み込み中...</div>}>
      <CreatureCatalogContent />
    </Suspense>
  );
}
