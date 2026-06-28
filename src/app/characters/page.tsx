"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { supabase, isSupabaseConfigured, Character, CharacterSkill, CharacterStatus } from "@/lib/supabase";
import CharacterCard from "@/app/_components/CharacterCard";

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

  const filtered =
    filter === "all" ? characters : characters.filter((c) => c.status === filter);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-cinzel text-2xl font-bold text-coc-text">
          キャラクター一覧
        </h1>
        <Link
          href="/characters/new"
          className="flex items-center gap-1.5 rounded-lg border border-coc-gold-dim bg-coc-raised px-3 py-2 text-sm text-coc-gold hover:bg-coc-surface hover:border-coc-gold transition-colors"
        >
          <Plus size={16} />
          新しいキャラクター
        </Link>
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
        <div className="flex justify-center items-center py-24 text-coc-muted font-crimson text-lg italic animate-pulse">
          異界の扉を開いています...
        </div>
      )}

      {/* 空状態 */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <span className="text-5xl text-coc-faint select-none">✦</span>
          <p className="text-coc-muted font-crimson text-lg italic text-center">
            {filter === "all"
              ? "まだキャラクターが登録されていません。\n新たな探索者を召喚せよ。"
              : "該当するキャラクターがいません。"}
          </p>
          {filter === "all" && (
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
            />
          ))}
        </div>
      )}
    </div>
  );
}
