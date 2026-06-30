"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Upload, X } from "lucide-react";
import { supabase, isSupabaseConfigured, Character, CharacterSkill, CharacterStatus } from "@/lib/supabase";
import CharacterCard from "@/app/_components/CharacterCard";
import CharacterCardSkeleton from "@/app/_components/CharacterCardSkeleton";

const FILTERS: { label: string; value: CharacterStatus | "all" }[] = [
  { label: "すべて",  value: "all"     },
  { label: "生存",    value: "alive"   },
  { label: "死亡",    value: "dead"    },
  { label: "狂気",    value: "insane"  },
  { label: "引退",    value: "retired" },
];

type CharacterWithSkills = Character & { character_skills: CharacterSkill[] };

export default function CharactersPage() {
  const [characters, setCharacters] = useState<CharacterWithSkills[]>([]);
  const [filter, setFilter] = useState<CharacterStatus | "all">("all");
  const [nameQuery, setNameQuery] = useState("");
  const [occupationQuery, setOccupationQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    async function load() {
      const { data } = await supabase
        .from("characters")
        .select("*, character_skills(*)")
        .order("updated_at", { ascending: false });
      if (data) setCharacters(data as CharacterWithSkills[]);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = characters
    .filter((c) => {
      if (filter !== "all" && c.status !== filter) return false;
      if (nameQuery && !c.name.toLowerCase().includes(nameQuery.toLowerCase())) return false;
      if (occupationQuery && !(c.occupation ?? "").toLowerCase().includes(occupationQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return 0;
    });

  function handleTogglePin(id: string, pinned: boolean) {
    setCharacters((prev) => prev.map((c) => (c.id === id ? { ...c, is_pinned: pinned } : c)));
  }

  const hasActiveSearch = nameQuery !== "" || occupationQuery !== "";

  function clearSearch() {
    setNameQuery("");
    setOccupationQuery("");
  }

  return (
    <div className="coc-page-enter mx-auto max-w-6xl px-4 py-8">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-cinzel text-2xl font-bold text-coc-text">
          キャラクター一覧
        </h1>
        <div className="flex items-center gap-2">
          <Link
            href="/characters/import"
            className="flex items-center gap-1.5 rounded-lg border border-coc-border px-3 py-2 text-sm text-coc-muted hover:text-coc-text hover:border-coc-border-glow transition-colors"
          >
            <Upload size={16} />
            JSONからインポート
          </Link>
          <Link
            href="/characters/new"
            className="flex items-center gap-1.5 rounded-lg border border-coc-gold-dim bg-coc-raised px-3 py-2 text-sm text-coc-gold hover:bg-coc-surface hover:border-coc-gold transition-colors"
          >
            <Plus size={16} />
            新しいキャラクター
          </Link>
        </div>
      </div>

      {/* 検索バー */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-coc-muted pointer-events-none" />
          <input
            type="text"
            placeholder="名前で検索..."
            value={nameQuery}
            onChange={(e) => setNameQuery(e.target.value)}
            className="w-full rounded-lg border border-coc-border bg-coc-surface pl-8 pr-3 py-2 text-sm text-coc-text placeholder-coc-muted focus:outline-none focus:border-coc-gold transition-colors"
          />
        </div>
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-coc-muted pointer-events-none" />
          <input
            type="text"
            placeholder="職業で検索..."
            value={occupationQuery}
            onChange={(e) => setOccupationQuery(e.target.value)}
            className="w-full rounded-lg border border-coc-border bg-coc-surface pl-8 pr-3 py-2 text-sm text-coc-text placeholder-coc-muted focus:outline-none focus:border-coc-gold transition-colors"
          />
        </div>
        {hasActiveSearch && (
          <button
            onClick={clearSearch}
            className="flex items-center gap-1 rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-xs text-coc-muted hover:text-coc-text hover:border-coc-gold transition-colors"
          >
            <X size={14} />
            クリア
          </button>
        )}
      </div>

      {/* フィルタータブ */}
      <div className="flex gap-1 mb-6 border-b border-coc-border">
        {FILTERS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              filter === value
                ? "border-coc-gold text-coc-gold"
                : "border-transparent text-coc-muted hover:text-coc-text"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ローディング */}
      {loading && (
        <div className="space-y-6">
          <p className="text-center text-coc-muted font-crimson text-sm italic">
            異界の扉を開いています...
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <CharacterCardSkeleton key={i} />
            ))}
          </div>
        </div>
      )}

      {/* 空状態 */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <span className="text-5xl text-coc-faint select-none">✦</span>
          <p className="text-coc-muted font-crimson text-lg italic text-center">
            {characters.length === 0
              ? "まだキャラクターが登録されていません。\n新たな探索者を召喚せよ。"
              : "条件に一致するキャラクターがいません。"}
          </p>
          {characters.length === 0 && (
            <Link
              href="/characters/new"
              className="mt-2 text-sm text-coc-gold hover:underline"
            >
              + キャラクターを追加する
            </Link>
          )}
        </div>
      )}

      {/* キャラクターグリッド */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((char) => (
            <CharacterCard
              key={char.id}
              character={char}
              skills={char.character_skills}
              onTogglePin={handleTogglePin}
            />
          ))}
        </div>
      )}
    </div>
  );
}
