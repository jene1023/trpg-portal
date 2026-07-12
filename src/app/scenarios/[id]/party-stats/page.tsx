export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase, isSupabaseConfigured, CharacterSkill } from "@/lib/supabase";

type CharacterData = {
  id: string;
  name: string;
  occupation: string | null;
  str: number;
  con: number;
  pow: number;
  dex: number;
  app: number;
  siz: number;
  int_stat: number;
  edu: number;
  hp_current: number;
  mp_current: number;
  san_current: number;
  character_skills: CharacterSkill[];
};

type ParticipantRow = {
  character_id: string;
  characters: CharacterData | null;
};

type AbilityKey = keyof Pick<
  CharacterData,
  "str" | "con" | "pow" | "dex" | "app" | "siz" | "int_stat" | "edu" | "hp_current" | "mp_current" | "san_current"
>;

const ABILITY_ROWS: { key: AbilityKey; label: string }[] = [
  { key: "str", label: "STR" },
  { key: "con", label: "CON" },
  { key: "pow", label: "POW" },
  { key: "dex", label: "DEX" },
  { key: "app", label: "APP" },
  { key: "siz", label: "SIZ" },
  { key: "int_stat", label: "INT" },
  { key: "edu", label: "EDU" },
  { key: "hp_current", label: "HP現在" },
  { key: "mp_current", label: "MP現在" },
  { key: "san_current", label: "SAN現在" },
];

const TOP_SKILL_COUNT = 5;

type Props = { params: Promise<{ id: string }> };

export default async function PartyStatsPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: scenario } = await supabase
    .from("scenarios")
    .select("id, title")
    .eq("id", id)
    .single();

  if (!scenario) notFound();

  const { data: participantRows } = await supabase
    .from("scenario_participants")
    .select("character_id, characters(id, name, occupation, str, con, pow, dex, app, siz, int_stat, edu, hp_current, mp_current, san_current, character_skills(*))")
    .eq("scenario_id", id)
    .order("created_at", { ascending: true });

  const rows = (participantRows ?? []) as unknown as ParticipantRow[];
  const chars = rows.map((r) => r.characters).filter((c): c is CharacterData => c !== null);

  const getTopSkills = (char: CharacterData): CharacterSkill[] =>
    [...char.character_skills]
      .sort((a, b) => b.current_value - a.current_value)
      .slice(0, TOP_SKILL_COUNT);

  const allTopSkillNames = Array.from(
    new Set(chars.flatMap((c) => getTopSkills(c).map((s) => s.skill_name)))
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/scenarios/${id}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          シナリオ詳細
        </Link>
      </div>

      <div className="mb-6">
        <p className="text-xs text-coc-muted mb-1">{scenario.title}</p>
        <h1 className="font-cinzel text-2xl font-bold text-coc-text">能力値比較テーブル</h1>
        <p className="text-sm text-coc-muted mt-1">参加キャラクターの能力値と代表技能を横並び比較</p>
      </div>

      {chars.length === 0 ? (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-12 text-center">
          <p className="text-coc-muted">参加キャラクターが登録されていません。</p>
          <Link
            href={`/scenarios/${id}/participants`}
            className="mt-3 inline-block text-sm text-coc-gold hover:underline"
          >
            参加者を追加する →
          </Link>
        </div>
      ) : (
        <>
          {/* 能力値テーブル */}
          <div className="mb-6">
            <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest mb-3">能力値</h2>
            <div className="overflow-x-auto rounded-xl border border-coc-border bg-coc-surface">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-coc-border">
                    <th className="px-4 py-3 text-left text-xs text-coc-muted font-medium w-24 sticky left-0 bg-coc-surface">
                      能力値
                    </th>
                    {chars.map((c) => (
                      <th key={c.id} className="px-4 py-3 text-center font-medium text-coc-text min-w-24">
                        <Link
                          href={`/characters/${c.id}`}
                          className="hover:text-coc-gold transition-colors"
                        >
                          {c.name}
                        </Link>
                        {c.occupation && (
                          <p className="text-xs font-normal text-coc-muted">{c.occupation}</p>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ABILITY_ROWS.map(({ key, label }, rowIdx) => {
                    const values = chars.map((c) => c[key] ?? 0);
                    const maxVal = Math.max(...values);

                    return (
                      <tr
                        key={key}
                        className={rowIdx % 2 === 0 ? "" : "bg-coc-raised/30"}
                      >
                        <td className="px-4 py-3 text-xs font-semibold text-coc-muted sticky left-0 bg-inherit">
                          {label}
                        </td>
                        {chars.map((c) => {
                          const val = c[key] ?? 0;
                          const isMax = val === maxVal && chars.length > 1;

                          return (
                            <td
                              key={c.id}
                              className={`px-4 py-3 text-center ${isMax ? "bg-green-100" : ""}`}
                            >
                              <span
                                className={
                                  isMax
                                    ? "text-base font-bold text-green-700"
                                    : "text-base font-medium text-coc-text"
                                }
                              >
                                {val}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {chars.length > 1 && (
              <p className="mt-2 text-xs text-coc-muted text-center">
                緑色のセルは各行の最高値を示します。
              </p>
            )}
          </div>

          {/* 代表技能テーブル */}
          {allTopSkillNames.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest mb-3">
                代表技能（各キャラ上位{TOP_SKILL_COUNT}技能）
              </h2>
              <div className="overflow-x-auto rounded-xl border border-coc-border bg-coc-surface">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-coc-border">
                      <th className="px-4 py-3 text-left text-xs text-coc-muted font-medium w-32 sticky left-0 bg-coc-surface">
                        技能名
                      </th>
                      {chars.map((c) => (
                        <th key={c.id} className="px-4 py-3 text-center font-medium text-coc-text min-w-24">
                          {c.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allTopSkillNames.map((skillName, rowIdx) => {
                      const values = chars.map((c) => {
                        const sk = c.character_skills.find((s) => s.skill_name === skillName);
                        return sk?.current_value ?? null;
                      });
                      const presentValues = values.filter((v): v is number => v !== null);
                      const maxVal = presentValues.length > 0 ? Math.max(...presentValues) : null;

                      return (
                        <tr
                          key={skillName}
                          className={rowIdx % 2 === 0 ? "" : "bg-coc-raised/30"}
                        >
                          <td className="px-4 py-3 text-xs font-semibold text-coc-muted sticky left-0 bg-inherit">
                            {skillName}
                          </td>
                          {chars.map((c, ci) => {
                            const val = values[ci];
                            const isMax =
                              val !== null &&
                              maxVal !== null &&
                              val === maxVal &&
                              presentValues.length > 1;

                            return (
                              <td
                                key={c.id}
                                className={`px-4 py-3 text-center ${isMax ? "bg-green-100" : ""}`}
                              >
                                {val !== null ? (
                                  <span
                                    className={
                                      isMax
                                        ? "text-base font-bold text-green-700"
                                        : "text-base font-medium text-coc-text"
                                    }
                                  >
                                    {val}
                                  </span>
                                ) : (
                                  <span className="text-coc-muted text-xs">—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
