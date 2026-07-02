"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { supabase, isSupabaseConfigured, Character, CharacterSkill } from "@/lib/supabase";

type CharacterWithSkills = Character & { character_skills: CharacterSkill[] };

type AbilityRow = {
  label: string;
  key: keyof Character;
};

const ABILITY_ROWS: AbilityRow[] = [
  { label: "STR", key: "str" },
  { label: "CON", key: "con" },
  { label: "POW", key: "pow" },
  { label: "DEX", key: "dex" },
  { label: "APP", key: "app" },
  { label: "SIZ", key: "siz" },
  { label: "INT", key: "int_stat" },
  { label: "EDU", key: "edu" },
  { label: "HP最大", key: "hp_max" },
  { label: "MP最大", key: "mp_max" },
  { label: "SAN最大", key: "san_max" },
];

function ComparePageInner() {
  const searchParams = useSearchParams();
  const idsParam = searchParams.get("ids") ?? "";

  const [characters, setCharacters] = useState<CharacterWithSkills[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = idsParam.split(",").filter(Boolean).slice(0, 4);
    if (!isSupabaseConfigured || ids.length < 2) {
      setLoading(false);
      return;
    }
    async function load() {
      const ids = idsParam.split(",").filter(Boolean).slice(0, 4);
      const { data } = await supabase
        .from("characters")
        .select("*, character_skills(*)")
        .in("id", ids);
      if (data) {
        const ordered = ids
          .map((id) => (data as CharacterWithSkills[]).find((c) => c.id === id))
          .filter(Boolean) as CharacterWithSkills[];
        setCharacters(ordered);
      }
      setLoading(false);
    }
    load();
  }, [idsParam]);

  const ids = idsParam.split(",").filter(Boolean).slice(0, 4);

  const commonSkillNames =
    characters.length >= 2
      ? characters[0].character_skills
          .map((s) => s.skill_name)
          .filter((name) =>
            characters.every((c) =>
              c.character_skills.some((s) => s.skill_name === name)
            )
          )
          .sort()
      : [];

  function getAbilityMax(key: keyof Character): number {
    return Math.max(...characters.map((c) => (c[key] as number) ?? 0));
  }

  function getSkillMax(skillName: string): number {
    return Math.max(
      ...characters.map((c) => {
        const s = c.character_skills.find((sk) => sk.skill_name === skillName);
        return s?.current_value ?? 0;
      })
    );
  }

  const cellClass =
    "px-4 py-2.5 text-center font-mono font-semibold text-coc-text";
  const cellHighlightClass =
    "px-4 py-2.5 text-center font-mono font-semibold text-emerald-400";

  return (
    <div className="coc-page-enter mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/characters"
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          一覧へ
        </Link>
        <h1 className="font-cinzel text-xl font-bold text-coc-text">
          キャラクター比較
        </h1>
      </div>

      {ids.length < 2 && (
        <div className="rounded-lg border border-coc-border bg-coc-surface p-8 text-center space-y-3">
          <p className="text-coc-muted text-sm">
            比較するには2〜4体のキャラクターを選択してください。
          </p>
          <Link
            href="/characters"
            className="inline-block text-sm text-coc-gold hover:underline"
          >
            キャラクター一覧に戻る
          </Link>
        </div>
      )}

      {loading && ids.length >= 2 && (
        <p className="text-center text-coc-muted text-sm py-16">
          読み込み中...
        </p>
      )}

      {!loading && characters.length >= 2 && (
        <div className="space-y-6">
          {/* 能力値比較テーブル */}
          <div className="rounded-lg border border-coc-border coc-card-bg overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-coc-border">
                  <th className="px-4 py-3 text-left font-cinzel text-xs text-coc-muted uppercase tracking-wider w-28">
                    能力値
                  </th>
                  {characters.map((c) => (
                    <th key={c.id} className="px-4 py-3 text-center min-w-[130px]">
                      <Link
                        href={`/characters/${c.id}`}
                        className="font-cinzel font-bold text-coc-gold hover:underline block"
                      >
                        {c.name}
                      </Link>
                      {c.occupation && (
                        <span className="block text-xs text-coc-muted font-normal mt-0.5">
                          {c.occupation}
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ABILITY_ROWS.map(({ label, key }) => {
                  const maxVal = getAbilityMax(key);
                  return (
                    <tr
                      key={label}
                      className="border-b border-coc-border/50 last:border-0 hover:bg-coc-surface/50 transition-colors"
                    >
                      <td className="px-4 py-2.5 text-xs font-semibold text-coc-muted uppercase tracking-wider">
                        {label}
                      </td>
                      {characters.map((c) => {
                        const val = (c[key] as number) ?? 0;
                        const isMax = val === maxVal && maxVal > 0;
                        return (
                          <td
                            key={c.id}
                            className={isMax ? cellHighlightClass : cellClass}
                          >
                            {val}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 共通技能比較テーブル */}
          {commonSkillNames.length > 0 ? (
            <div className="rounded-lg border border-coc-border coc-card-bg overflow-x-auto">
              <div className="px-4 py-3 border-b border-coc-border">
                <h2 className="font-cinzel text-sm font-semibold text-coc-muted uppercase tracking-wider">
                  共通技能 ({commonSkillNames.length}件)
                </h2>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-coc-border">
                    <th className="px-4 py-3 text-left text-xs text-coc-muted w-44">
                      技能名
                    </th>
                    {characters.map((c) => (
                      <th
                        key={c.id}
                        className="px-4 py-3 text-center text-xs font-cinzel text-coc-muted min-w-[100px]"
                      >
                        {c.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {commonSkillNames.map((skillName) => {
                    const maxVal = getSkillMax(skillName);
                    return (
                      <tr
                        key={skillName}
                        className="border-b border-coc-border/50 last:border-0 hover:bg-coc-surface/50 transition-colors"
                      >
                        <td className="px-4 py-2 text-xs text-coc-text">
                          {skillName}
                        </td>
                        {characters.map((c) => {
                          const skill = c.character_skills.find(
                            (s) => s.skill_name === skillName
                          );
                          const val = skill?.current_value ?? 0;
                          const isMax = val === maxVal && maxVal > 0;
                          return (
                            <td
                              key={c.id}
                              className={`px-4 py-2 text-center font-mono text-xs font-semibold ${
                                isMax ? "text-emerald-400" : "text-coc-text"
                              }`}
                            >
                              {val}%
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-coc-muted text-sm py-4">
              全キャラクターに共通する技能が見つかりません。
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-16 text-sm text-coc-muted">読み込み中...</div>}>
      <ComparePageInner />
    </Suspense>
  );
}
