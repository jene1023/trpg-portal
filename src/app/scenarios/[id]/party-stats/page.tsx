export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase, isSupabaseConfigured, Character, ScenarioParticipant } from "@/lib/supabase";

type ParticipantWithCharacter = ScenarioParticipant & {
  characters: Character;
};

type AbilityKey = "str" | "con" | "pow" | "dex" | "app" | "siz" | "int_stat" | "edu";

const ABILITY_ROWS: { key: AbilityKey; label: string }[] = [
  { key: "str", label: "STR" },
  { key: "con", label: "CON" },
  { key: "pow", label: "POW" },
  { key: "dex", label: "DEX" },
  { key: "app", label: "APP" },
  { key: "siz", label: "SIZ" },
  { key: "int_stat", label: "INT" },
  { key: "edu", label: "EDU" },
];

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

  const { data: participants } = await supabase
    .from("scenario_participants")
    .select("*, characters(*)")
    .eq("scenario_id", id)
    .order("created_at", { ascending: true });

  const list = (participants ?? []) as ParticipantWithCharacter[];
  const chars = list.map((p) => p.characters).filter(Boolean);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
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
        <p className="text-sm text-coc-muted mt-1">参加者全員の8能力値（STR/CON/POW/DEX/APP/SIZ/INT/EDU）を横並びで確認</p>
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
        <div className="overflow-x-auto rounded-xl border border-coc-border bg-coc-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-coc-border">
                <th className="px-4 py-3 text-left text-xs text-coc-muted font-medium w-20 sticky left-0 bg-coc-surface">
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
                const values = chars.map((c) => (c[key] as unknown as number) ?? 0);
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
                      const val = (c[key] as unknown as number) ?? 0;
                      const isMax = val === maxVal && chars.length > 1;

                      return (
                        <td key={c.id} className="px-4 py-3 text-center">
                          <span
                            className={
                              isMax
                                ? "text-base font-bold text-emerald-600"
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
      )}

      {chars.length > 1 && (
        <p className="mt-3 text-xs text-coc-muted text-center">
          緑色は各能力値の最高値を示します。
        </p>
      )}
    </div>
  );
}
