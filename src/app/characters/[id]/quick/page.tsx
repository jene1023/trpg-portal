export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import QuickStatEditor from "@/app/_components/QuickStatEditor";
import DiceRoller from "@/app/_components/DiceRoller";

type Props = { params: Promise<{ id: string }> };

const colorClass: Record<string, string> = {
  hp: "text-[var(--color-coc-hp)]",
  mp: "text-[var(--color-coc-mp)]",
  san: "text-[var(--color-coc-san)]",
};

export default async function QuickDashboardPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: char } = await supabase
    .from("characters")
    .select("*")
    .eq("id", id)
    .single();

  if (!char) notFound();

  const { data: skills } = await supabase
    .from("character_skills")
    .select("*")
    .eq("character_id", id);

  const stats = [
    { key: "hp", label: "HP", current: char.hp_current, max: char.hp_max },
    { key: "mp", label: "MP", current: char.mp_current, max: char.mp_max },
    { key: "san", label: "SAN", current: char.san_current, max: char.san_max },
  ];

  return (
    <div className="mx-auto max-w-md px-4 py-6 space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <Link
          href={`/characters/${id}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          詳細へ
        </Link>
        <h1 className="font-cinzel text-base font-semibold text-coc-text">{char.name}</h1>
      </div>

      {/* HP / MP / SAN 大表示 */}
      <div className="rounded-lg border border-coc-border bg-coc-surface p-4">
        <div className="grid grid-cols-3 gap-3 mb-4">
          {stats.map(({ key, label, current, max }) => (
            <div key={key} className="flex flex-col items-center gap-1">
              <span className={`text-xs font-semibold tracking-widest ${colorClass[key]}`}>
                {label}
              </span>
              <span className={`text-5xl font-bold tabular-nums leading-none ${colorClass[key]}`}>
                {current}
              </span>
              <span className="text-sm text-coc-muted">/{max}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-coc-border pt-4">
          <QuickStatEditor
            characterId={char.id}
            hpCurrent={char.hp_current}
            hpMax={char.hp_max}
            mpCurrent={char.mp_current}
            mpMax={char.mp_max}
            sanCurrent={char.san_current}
            sanMax={char.san_max}
          />
        </div>
      </div>

      {/* ダイスローラー */}
      {(skills ?? []).length > 0 && (
        <div className="rounded-lg border border-coc-border bg-coc-surface p-4">
          <h2 className="font-cinzel text-sm font-semibold text-coc-muted uppercase tracking-widest mb-3">
            ダイスロール
          </h2>
          <DiceRoller skills={skills ?? []} />
        </div>
      )}

      {/* クイックノートへのショートカット */}
      <Link
        href={`/characters/${id}/quick-notes`}
        className="flex items-center justify-between rounded-lg border border-coc-border bg-coc-surface px-4 py-3 text-sm text-coc-muted hover:text-coc-text hover:border-coc-border-glow transition-colors"
      >
        <span>メモ（クイックノート）</span>
        <span className="text-coc-gold">→</span>
      </Link>
    </div>
  );
}
