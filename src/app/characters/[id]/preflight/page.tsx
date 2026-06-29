export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldAlert, Swords, ScrollText, Brain } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type Props = { params: Promise<{ id: string }> };

function statColor(current: number, max: number): string {
  const ratio = max > 0 ? current / max : 1;
  if (ratio <= 0.25) return "text-red-400";
  if (ratio <= 0.5) return "text-yellow-400";
  return "text-coc-text";
}

function statBg(current: number, max: number): string {
  const ratio = max > 0 ? current / max : 1;
  if (ratio <= 0.25) return "border-red-800 bg-red-950/20";
  if (ratio <= 0.5) return "border-yellow-800 bg-yellow-950/20";
  return "border-coc-border bg-coc-surface";
}

function statBarWidth(current: number, max: number): string {
  const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
  return `${pct}%`;
}

function statBarColor(current: number, max: number): string {
  const ratio = max > 0 ? current / max : 1;
  if (ratio <= 0.25) return "bg-red-600";
  if (ratio <= 0.5) return "bg-yellow-500";
  return "bg-coc-gold";
}

export default async function PreflightPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: char } = await supabase
    .from("characters")
    .select("*, character_skills(*), inventory_items(*), madness_records(*), sessions(*)")
    .eq("id", id)
    .single();

  if (!char) notFound();

  const activeMadness = (char.madness_records ?? []).filter(
    (r: { is_active: boolean }) => r.is_active
  );

  const weapons = (char.inventory_items ?? []).filter(
    (i: { item_type: string }) => i.item_type === "weapon"
  );

  const latestSession = (char.sessions ?? []).sort(
    (a: { session_number: number }, b: { session_number: number }) =>
      b.session_number - a.session_number
  )[0] ?? null;

  const sectionClass = "rounded-lg border bg-coc-surface p-4";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/characters/${id}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          {char.name}
        </Link>
      </div>

      <div className="flex items-center gap-2 mb-1">
        <ShieldAlert size={20} className="text-coc-gold" />
        <h1 className="font-cinzel text-xl font-bold text-coc-text">
          セッション前確認
        </h1>
      </div>
      <p className="text-sm text-coc-muted mb-6">
        セッション開始前にHP・SAN・装備・狂気・前回ログをまとめて確認できます。
      </p>

      {/* HP / MP / SAN */}
      <div className={`${sectionClass} border-coc-border mb-4 space-y-4`}>
        <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest">
          現在ステータス
        </h2>
        {[
          { label: "HP 耐久力", current: char.hp_current, max: char.hp_max },
          { label: "MP マジックポイント", current: char.mp_current, max: char.mp_max },
          { label: "SAN 正気度", current: char.san_current, max: char.san_max },
        ].map(({ label, current, max }) => (
          <div key={label} className={`rounded-lg border p-3 ${statBg(current, max)}`}>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-sm text-coc-muted">{label}</span>
              <span className={`text-2xl font-bold ${statColor(current, max)}`}>
                {current}
                <span className="text-sm font-normal text-coc-muted ml-1">/ {max}</span>
              </span>
            </div>
            <div className="h-2 rounded-full bg-coc-raised overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${statBarColor(current, max)}`}
                style={{ width: statBarWidth(current, max) }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* アクティブな狂気 */}
      <div className={`${sectionClass} border-coc-border mb-4`}>
        <div className="flex items-center gap-2 mb-3">
          <Brain size={16} className={activeMadness.length > 0 ? "text-red-400" : "text-coc-muted"} />
          <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest">
            発症中の狂気
          </h2>
          {activeMadness.length > 0 && (
            <span className="ml-auto rounded bg-red-900/60 border border-red-700 px-2 py-0.5 text-xs text-red-300 font-semibold">
              {activeMadness.length}件
            </span>
          )}
        </div>
        {activeMadness.length === 0 ? (
          <p className="text-sm text-coc-muted">発症中の狂気なし</p>
        ) : (
          <ul className="space-y-2">
            {activeMadness.map((r: { id: string; madness_type: string; symptom: string }) => (
              <li
                key={r.id}
                className="rounded-md border border-red-800 bg-red-950/20 px-3 py-2"
              >
                <span className="text-xs text-red-400 font-semibold mr-2">
                  {r.madness_type === "temporary" ? "一時的" : "不定の"}狂気
                </span>
                <span className="text-sm text-coc-text">{r.symptom}</span>
              </li>
            ))}
          </ul>
        )}
        <Link
          href={`/characters/${id}/madness`}
          className="mt-3 inline-block text-xs text-coc-muted hover:text-coc-text transition-colors"
        >
          狂気記録を管理 →
        </Link>
      </div>

      {/* 所持武器 */}
      <div className={`${sectionClass} border-coc-border mb-4`}>
        <div className="flex items-center gap-2 mb-3">
          <Swords size={16} className="text-coc-muted" />
          <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest">
            所持武器
          </h2>
          <span className="ml-auto text-xs text-coc-muted">{weapons.length}件</span>
        </div>
        {weapons.length === 0 ? (
          <p className="text-sm text-coc-muted">武器なし</p>
        ) : (
          <ul className="space-y-2">
            {weapons.map(
              (w: {
                id: string;
                name: string;
                damage: string | null;
                range: string | null;
                ammo_current: number | null;
                ammo_max: number | null;
              }) => (
                <li
                  key={w.id}
                  className="rounded-md border border-coc-border bg-coc-raised px-3 py-2 flex items-center justify-between"
                >
                  <span className="text-sm font-semibold text-coc-text">{w.name}</span>
                  <div className="flex gap-3 text-xs text-coc-muted">
                    {w.damage && <span>ダメージ: {w.damage}</span>}
                    {w.range && <span>射程: {w.range}</span>}
                    {w.ammo_max != null && (
                      <span
                        className={
                          (w.ammo_current ?? 0) === 0 ? "text-red-400" : ""
                        }
                      >
                        弾: {w.ammo_current ?? 0}/{w.ammo_max}
                      </span>
                    )}
                  </div>
                </li>
              )
            )}
          </ul>
        )}
        <Link
          href={`/characters/${id}/inventory`}
          className="mt-3 inline-block text-xs text-coc-muted hover:text-coc-text transition-colors"
        >
          所持品を管理 →
        </Link>
      </div>

      {/* 前回セッションサマリー */}
      <div className={`${sectionClass} border-coc-border mb-4`}>
        <div className="flex items-center gap-2 mb-3">
          <ScrollText size={16} className="text-coc-muted" />
          <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest">
            前回セッション
          </h2>
        </div>
        {!latestSession ? (
          <p className="text-sm text-coc-muted">セッションログなし</p>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-coc-muted">
                第{latestSession.session_number}回
              </span>
              <span className="text-sm font-semibold text-coc-text">
                {latestSession.title}
              </span>
            </div>
            {latestSession.summary && (
              <p className="text-sm text-coc-muted leading-relaxed whitespace-pre-wrap">
                {latestSession.summary}
              </p>
            )}
            <div className="flex gap-4 text-xs mt-1">
              {latestSession.san_loss > 0 && (
                <span className="text-red-400">SAN損失: -{latestSession.san_loss}</span>
              )}
              {latestSession.hp_loss > 0 && (
                <span className="text-orange-400">HP損失: -{latestSession.hp_loss}</span>
              )}
              {latestSession.played_at && (
                <span className="text-coc-muted">
                  {new Date(latestSession.played_at).toLocaleDateString("ja-JP")}
                </span>
              )}
            </div>
          </div>
        )}
        <Link
          href={`/characters/${id}/sessions`}
          className="mt-3 inline-block text-xs text-coc-muted hover:text-coc-text transition-colors"
        >
          セッションログを見る →
        </Link>
      </div>

      {/* 関係メモへのリンク */}
      <Link
        href={`/characters/${id}/relations`}
        className="flex items-center justify-between rounded-lg border border-coc-border bg-coc-surface px-4 py-3 text-sm text-coc-muted hover:text-coc-text hover:border-coc-border-glow transition-colors"
      >
        <span>関係メモを確認する</span>
        <span className="text-coc-gold">→</span>
      </Link>
    </div>
  );
}
