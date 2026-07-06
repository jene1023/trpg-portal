"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Upload, X, GitCompare, Trophy } from "lucide-react";
import { supabase, isSupabaseConfigured, Character, CharacterSkill, CharacterStatus, Tag } from "@/lib/supabase";
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
type EntityTagRow = { entity_id: string; tags: Tag | null };

export default function CharactersPage() {
  const [characters, setCharacters] = useState<CharacterWithSkills[]>([]);
  const [filter, setFilter] = useState<CharacterStatus | "all">("all");
  const [nameQuery, setNameQuery] = useState("");
  const [occupationQuery, setOccupationQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [tagsByCharacter, setTagsByCharacter] = useState<Record<string, Tag[]>>({});
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    async function load() {
      const [{ data: charsData }, { data: entityTagsData }] = await Promise.all([
        supabase
          .from("characters")
          .select("*, character_skills(*)")
          .order("updated_at", { ascending: false }),
        supabase
          .from("entity_tags")
          .select("entity_id, tags(id, name, created_at)")
          .eq("entity_type", "character"),
      ]);
      if (charsData) setCharacters(charsData as CharacterWithSkills[]);
      if (entityTagsData) {
        const map: Record<string, Tag[]> = {};
        for (const row of entityTagsData as EntityTagRow[]) {
          if (!row.tags) continue;
          if (!map[row.entity_id]) map[row.entity_id] = [];
          map[row.entity_id].push(row.tags);
        }
        setTagsByCharacter(map);
      }
      setLoading(false);
    }
    load();
  }, []);

  const allTagNames = Array.from(
    new Set(Object.values(tagsByCharacter).flat().map((t) => t.name))
  ).sort();

  function toggleTag(name: string) {
    setSelectedTags((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]
    );
  }

  const filtered = characters
    .filter((c) => {
      if (filter !== "all" && c.status !== filter) return false;
      if (nameQuery && !c.name.toLowerCase().includes(nameQuery.toLowerCase())) return false;
      if (occupationQuery && !(c.occupation ?? "").toLowerCase().includes(occupationQuery.toLowerCase())) return false;
      if (selectedTags.length > 0) {
        const charTagNames = (tagsByCharacter[c.id] ?? []).map((t) => t.name);
        if (!selectedTags.some((tag) => charTagNames.includes(tag))) return false;
      }
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

  function toggleCompare(id: string) {
    setCompareIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 4) {
        next.add(id);
      }
      return next;
    });
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
            href="/characters/hall-of-fame"
            className="flex items-center gap-1.5 rounded-lg border border-coc-border px-3 py-2 text-sm text-coc-muted hover:text-coc-text hover:border-coc-border-glow transition-colors"
          >
            <Trophy size={16} />
            記念碑
          </Link>
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

      {/* タグフィルタ */}
      {allTagNames.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-4">
          <span className="text-xs text-coc-muted mr-1">タグ:</span>
          {allTagNames.map((name) => (
            <button
              key={name}
              onClick={() => toggleTag(name)}
              className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                selectedTags.includes(name)
                  ? "border-coc-gold bg-coc-gold/20 text-coc-gold"
                  : "border-coc-border bg-coc-surface text-coc-muted hover:text-coc-text hover:border-coc-border-glow"
              }`}
            >
              {name}
            </button>
          ))}
          {selectedTags.length > 0 && (
            <button
              onClick={() => setSelectedTags([])}
              className="text-xs text-coc-muted hover:text-coc-text ml-1"
            >
              クリア
            </button>
          )}
        </div>
      )}

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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 coc-stagger-grid">
          {filtered.map((char) => (
            <CharacterCard
              key={char.id}
              character={char}
              skills={char.character_skills}
              onTogglePin={handleTogglePin}
              isCompared={compareIds.has(char.id)}
              onToggleCompare={toggleCompare}
            />
          ))}
        </div>
      )}

      {/* 比較スティッキーバー */}
      {compareIds.size >= 1 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-wrap items-center gap-2 rounded-xl border border-coc-gold/40 bg-coc-void/95 backdrop-blur-sm px-4 py-3 shadow-lg shadow-black/40 max-w-lg w-[calc(100vw-2rem)]">
          <div className="flex items-center gap-1.5 text-coc-muted">
            <GitCompare size={14} />
            <span className="text-xs font-medium">{compareIds.size}体選択中</span>
          </div>
          <div className="flex flex-wrap gap-1 flex-1">
            {Array.from(compareIds).map((id) => {
              const char = characters.find((c) => c.id === id);
              return char ? (
                <span
                  key={id}
                  className="flex items-center gap-1 rounded-full border border-coc-border px-2 py-0.5 text-xs text-coc-text"
                >
                  {char.name}
                  <button
                    onClick={() => toggleCompare(id)}
                    className="text-coc-muted hover:text-coc-text"
                  >
                    ×
                  </button>
                </span>
              ) : null;
            })}
          </div>
          {compareIds.size >= 2 ? (
            <Link
              href={`/characters/compare?ids=${Array.from(compareIds).join(",")}`}
              className="rounded-lg border border-coc-gold bg-coc-gold/20 px-3 py-1.5 text-sm text-coc-gold hover:bg-coc-gold/30 transition-colors font-medium whitespace-nowrap"
            >
              比較する →
            </Link>
          ) : (
            <span className="text-xs text-coc-muted whitespace-nowrap">
              あと{2 - compareIds.size}体追加
            </span>
          )}
          <button
            onClick={() => setCompareIds(new Set())}
            className="text-xs text-coc-muted hover:text-coc-text"
          >
            クリア
          </button>
        </div>
      )}
    </div>
  );
}
