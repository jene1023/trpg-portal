export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import QuickStatEditor from "@/app/_components/QuickStatEditor";
import QuickStatsDisplay from "@/app/_components/QuickStatsDisplay";
import DiceRoller from "@/app/_components/DiceRoller";
import ConditionBadgeEditor from "@/app/_components/ConditionBadgeEditor";
import LongRestButton from "@/app/_components/LongRestButton";

type Props = { params: Promise<{ id: string }> };

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

  const favoriteSkills = (skills ?? []).filter((s) => s.is_favorite);

  const { data: conditions } = await supabase
    .from("character_conditions")
    .select("*")
    .eq("character_id", id)
    .order("created_at", { ascending: true });

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
        <QuickStatsDisplay
          characterId={char.id}
          hpCurrent={char.hp_current}
          hpMax={char.hp_max}
          mpCurrent={char.mp_current}
          mpMax={char.mp_max}
          sanCurrent={char.san_current}
          sanMax={char.san_max}
        />

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

        <div className="border-t border-coc-border pt-4">
          <LongRestButton
            characterId={char.id}
            hpMax={char.hp_max}
            mpMax={char.mp_max}
            sanMax={char.san_max}
          />
        </div>
      </div>

      {/* 状態異常 */}
      <div className="rounded-lg border border-coc-border bg-coc-surface p-4">
        <h2 className="font-cinzel text-sm font-semibold text-coc-muted uppercase tracking-widest mb-3">
          状態異常
        </h2>
        <ConditionBadgeEditor
          characterId={char.id}
          initialConditions={conditions ?? []}
        />
      </div>

      {/* お気に入り技能クイックロール */}
      {favoriteSkills.length > 0 && (
        <div className="rounded-lg border border-yellow-400/30 bg-coc-surface p-4">
          <h2 className="font-cinzel text-sm font-semibold text-yellow-400 uppercase tracking-widest mb-3">
            ★ お気に入り技能
          </h2>
          <DiceRoller skills={favoriteSkills} characterId={char.id} />
        </div>
      )}

      {/* ダイスローラー（全技能） */}
      {(skills ?? []).length > 0 && (
        <div className="rounded-lg border border-coc-border bg-coc-surface p-4">
          <h2 className="font-cinzel text-sm font-semibold text-coc-muted uppercase tracking-widest mb-3">
            ダイスロール
          </h2>
          <DiceRoller skills={skills ?? []} characterId={char.id} />
        </div>
      )}

      {/* 口調・ロールプレイメモ */}
      {char.speech_style && (
        <details className="rounded-lg border border-coc-border bg-coc-surface">
          <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-coc-muted hover:text-coc-text select-none">
            口調・ロールプレイメモ
          </summary>
          <div className="px-4 pb-4 pt-1">
            <p className="font-crimson text-coc-text leading-relaxed whitespace-pre-wrap text-[15px]">
              {char.speech_style}
            </p>
          </div>
        </details>
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
