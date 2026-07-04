export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldAlert, Swords, ScrollText, Brain, Sparkles, AlertTriangle, Coffee, Target, Zap } from "lucide-react";
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

  const { data: spells } = await supabase
    .from("character_spells")
    .select("id, spell_name, mp_cost, san_cost")
    .eq("character_id", id)
    .order("created_at", { ascending: true });

  const { data: activeConditions } = await supabase
    .from("character_conditions")
    .select("id, condition_name, color, notes")
    .eq("character_id", id)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  const { data: latestDowntimes } = await supabase
    .from("character_downtime")
    .select("id, activity_type, title, result, created_at")
    .eq("character_id", id)
    .order("created_at", { ascending: false })
    .limit(3);

  const { data: pendingGoals } = await supabase
    .from("session_goals")
    .select("id, goal, set_at")
    .eq("character_id", id)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  const { data: activePhobias } = await supabase
    .from("character_phobias")
    .select("id, phobia_type, name, trigger_description")
    .eq("character_id", id)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

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

      {/* アクティブな状態異常 */}
      <div className={`${sectionClass} border-coc-border mb-4`}>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={16} className={(activeConditions ?? []).length > 0 ? "text-yellow-400" : "text-coc-muted"} />
          <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest">
            状態異常
          </h2>
          {(activeConditions ?? []).length > 0 && (
            <span className="ml-auto rounded bg-yellow-900/60 border border-yellow-700 px-2 py-0.5 text-xs text-yellow-300 font-semibold">
              {(activeConditions ?? []).length}件
            </span>
          )}
        </div>
        {(activeConditions ?? []).length === 0 ? (
          <p className="text-sm text-coc-muted">状態異常なし</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(activeConditions ?? []).map(
              (c: { id: string; condition_name: string; color: string | null; notes: string | null }) => (
                <span
                  key={c.id}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    c.color === "red"
                      ? "border-red-700 bg-red-950/40 text-red-300"
                      : c.color === "green"
                      ? "border-green-700 bg-green-950/40 text-green-300"
                      : c.color === "blue"
                      ? "border-blue-700 bg-blue-950/40 text-blue-300"
                      : c.color === "yellow"
                      ? "border-yellow-700 bg-yellow-950/40 text-yellow-300"
                      : "border-coc-border bg-coc-raised text-coc-muted"
                  }`}
                >
                  {c.condition_name}
                  {c.notes && (
                    <span className="ml-1 opacity-70">({c.notes})</span>
                  )}
                </span>
              )
            )}
          </div>
        )}
        <Link
          href={`/characters/${id}`}
          className="mt-3 inline-block text-xs text-coc-muted hover:text-coc-text transition-colors"
        >
          状態異常を管理 →
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

      {/* 習得呪文サマリー */}
      <div className={`${sectionClass} border-coc-border mb-4`}>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-coc-muted" />
          <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest">
            習得呪文
          </h2>
          <span className="ml-auto text-xs text-coc-muted">{(spells ?? []).length}件</span>
        </div>
        {(spells ?? []).length === 0 ? (
          <p className="text-sm text-coc-muted">習得呪文なし</p>
        ) : (
          <ul className="space-y-2">
            {(spells ?? []).map(
              (s: { id: string; spell_name: string; mp_cost: number | null; san_cost: number | null }) => (
                <li
                  key={s.id}
                  className="rounded-md border border-coc-border bg-coc-raised px-3 py-2 flex items-center justify-between"
                >
                  <span className="text-sm font-semibold text-coc-text">{s.spell_name}</span>
                  <div className="flex gap-2">
                    {s.mp_cost != null && (
                      <span className="text-xs text-blue-300">MP {s.mp_cost}</span>
                    )}
                    {s.san_cost != null && (
                      <span className="text-xs text-red-300">SAN {s.san_cost}</span>
                    )}
                  </div>
                </li>
              )
            )}
          </ul>
        )}
        <Link
          href={`/characters/${id}/spells`}
          className="mt-3 inline-block text-xs text-coc-muted hover:text-coc-text transition-colors"
        >
          呪文を管理 →
        </Link>
      </div>

      {/* 最新ダウンタイム活動 */}
      <div className={`${sectionClass} border-coc-border mb-4`}>
        <div className="flex items-center gap-2 mb-3">
          <Coffee size={16} className="text-coc-muted" />
          <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest">
            前回のダウンタイム活動
          </h2>
        </div>
        {(latestDowntimes ?? []).length === 0 ? (
          <p className="text-sm text-coc-muted">ダウンタイム活動の記録なし</p>
        ) : (
          <ul className="space-y-2">
            {(latestDowntimes ?? []).map(
              (dt: { id: string; activity_type: string; title: string; result: string | null; created_at: string }) => (
                <li
                  key={dt.id}
                  className="rounded-md border border-coc-border bg-coc-raised px-3 py-2 space-y-1"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-coc-muted">
                      {new Date(dt.created_at).toLocaleDateString("ja-JP")}
                    </span>
                    <span className="text-sm font-semibold text-coc-text">{dt.title}</span>
                  </div>
                  {dt.result && (
                    <p className="text-xs text-coc-gold leading-relaxed">{dt.result}</p>
                  )}
                </li>
              )
            )}
          </ul>
        )}
        <Link
          href={`/characters/${id}/downtime`}
          className="mt-3 inline-block text-xs text-coc-muted hover:text-coc-text transition-colors"
        >
          ダウンタイム活動を管理 →
        </Link>
      </div>

      {/* セッション目標 */}
      <div className={`${sectionClass} border-coc-border mb-4`}>
        <div className="flex items-center gap-2 mb-3">
          <Target size={16} className={(pendingGoals ?? []).length > 0 ? "text-coc-gold" : "text-coc-muted"} />
          <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest">
            セッション目標
          </h2>
          {(pendingGoals ?? []).length > 0 && (
            <span className="ml-auto rounded bg-coc-gold/20 border border-coc-gold/50 px-2 py-0.5 text-xs text-coc-gold font-semibold">
              {(pendingGoals ?? []).length}件
            </span>
          )}
        </div>
        {(pendingGoals ?? []).length === 0 ? (
          <p className="text-sm text-coc-muted">進行中の目標なし</p>
        ) : (
          <ul className="space-y-2">
            {(pendingGoals ?? []).map((g: { id: string; goal: string; set_at: string | null }) => (
              <li
                key={g.id}
                className="rounded-md border border-coc-border bg-coc-raised px-3 py-2"
              >
                <p className="text-sm text-coc-text leading-relaxed">{g.goal}</p>
                {g.set_at && (
                  <p className="text-xs text-coc-muted mt-0.5">
                    設定日: {new Date(g.set_at).toLocaleDateString("ja-JP")}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
        <Link
          href={`/characters/${id}/session-goals`}
          className="mt-3 inline-block text-xs text-coc-muted hover:text-coc-text transition-colors"
        >
          セッション目標を管理 →
        </Link>
      </div>

      {/* アクティブな恐怖症・マニア */}
      <div className={`${sectionClass} border-coc-border mb-4`}>
        <div className="flex items-center gap-2 mb-3">
          <Zap size={16} className={(activePhobias ?? []).length > 0 ? "text-purple-400" : "text-coc-muted"} />
          <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest">
            恐怖症・マニア（発症中）
          </h2>
          {(activePhobias ?? []).length > 0 && (
            <span className="ml-auto rounded bg-purple-900/60 border border-purple-700 px-2 py-0.5 text-xs text-purple-300 font-semibold">
              {(activePhobias ?? []).length}件
            </span>
          )}
        </div>
        {(activePhobias ?? []).length === 0 ? (
          <p className="text-sm text-coc-muted">発症中の恐怖症・マニアなし</p>
        ) : (
          <ul className="space-y-2">
            {(activePhobias ?? []).map(
              (p: { id: string; phobia_type: string; name: string; trigger_description: string | null }) => (
                <li
                  key={p.id}
                  className={`rounded-md border px-3 py-2 ${
                    p.phobia_type === "phobia"
                      ? "border-red-800 bg-red-950/20"
                      : "border-purple-800 bg-purple-950/20"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold ${
                      p.phobia_type === "phobia" ? "text-red-400" : "text-purple-400"
                    }`}>
                      {p.phobia_type === "phobia" ? "恐怖症" : "マニア"}
                    </span>
                    <span className="text-sm text-coc-text">{p.name}</span>
                  </div>
                  {p.trigger_description && (
                    <p className="text-xs text-coc-muted mt-0.5">トリガー: {p.trigger_description}</p>
                  )}
                </li>
              )
            )}
          </ul>
        )}
        <Link
          href={`/characters/${id}/phobias`}
          className="mt-3 inline-block text-xs text-coc-muted hover:text-coc-text transition-colors"
        >
          恐怖症・マニアを管理 →
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
