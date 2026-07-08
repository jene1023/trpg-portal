export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import PhobiaList from "@/app/_components/PhobiaList";
import MadnessList from "@/app/_components/MadnessList";

type Props = { params: Promise<{ id: string }> };

export default async function MentalHealthPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const [
    { data: char },
    { data: phobias },
    { data: madnessRecords },
    { data: sessions },
  ] = await Promise.all([
    supabase
      .from("characters")
      .select("id, name, san_current, san_max, san_start")
      .eq("id", id)
      .single(),
    supabase
      .from("character_phobias")
      .select("*")
      .eq("character_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("madness_records")
      .select("*")
      .eq("character_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("sessions")
      .select("session_number, san_loss")
      .eq("character_id", id)
      .order("session_number", { ascending: true }),
  ]);

  if (!char) notFound();

  const activePhobias = (phobias ?? []).filter((p) => p.is_active);
  const activeMadness = (madnessRecords ?? []).filter((r) => r.is_active);

  // SANの推移を累積で計算（開始値から引いていく）
  let sanRunning = char.san_start ?? char.san_max;
  const sanTrend = (sessions ?? []).map((s) => {
    const loss = s.san_loss ?? 0;
    sanRunning = Math.max(0, sanRunning - loss);
    return {
      session_number: s.session_number,
      san_loss: loss,
      san_remaining: sanRunning,
    };
  });

  const hasActiveSymptoms = activePhobias.length > 0 || activeMadness.length > 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* ブレッドクラム */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/characters/${id}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          {char.name}
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-2">
        <h1 className="font-cinzel text-xl font-bold text-coc-text">心理プロファイル</h1>
        {hasActiveSymptoms && (
          <span className="rounded bg-red-900/60 border border-red-700 px-2 py-0.5 text-xs text-red-300 font-semibold">
            発症中 {activeMadness.length + activePhobias.length}件
          </span>
        )}
      </div>
      <p className="text-sm text-coc-muted mb-6">
        フォビア・狂気状態・SAN推移を一画面で確認できます。
      </p>

      {/* 発症中の状態バッジ */}
      {hasActiveSymptoms && (
        <div className="rounded-lg border border-red-800/50 bg-red-950/10 p-4 mb-6">
          <h2 className="text-xs font-semibold text-red-400 uppercase tracking-widest mb-3">
            現在の発症状態
          </h2>
          <div className="flex flex-wrap gap-2">
            {activeMadness.map((r) => (
              <span
                key={r.id}
                className="rounded border border-red-700 bg-red-950/40 px-2.5 py-1 text-xs text-red-300 font-medium leading-snug"
              >
                {r.madness_type === "temporary" ? "一時狂気" : "不定狂気"}: {r.symptom}
              </span>
            ))}
            {activePhobias.map((p) => (
              <span
                key={p.id}
                className={`rounded border px-2.5 py-1 text-xs font-medium leading-snug ${
                  p.phobia_type === "phobia"
                    ? "border-orange-700 bg-orange-950/30 text-orange-300"
                    : "border-purple-700 bg-purple-950/30 text-purple-300"
                }`}
              >
                {p.phobia_type === "phobia" ? "フォビア" : "マニア"}: {p.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* SAN推移バー */}
      {sanTrend.length > 0 && (
        <div className="rounded-lg border border-coc-border bg-coc-surface p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest">
              SAN推移（セッション別）
            </h2>
            <span className="text-xs text-coc-muted">
              現在 <span className="text-coc-gold font-semibold">{char.san_current}</span>/{char.san_max}
            </span>
          </div>
          <div className="space-y-2">
            {sanTrend.map((s) => {
              const pct = char.san_max > 0 ? Math.round((s.san_remaining / char.san_max) * 100) : 0;
              const barColor =
                pct <= 25
                  ? "bg-red-600"
                  : pct <= 50
                  ? "bg-yellow-500"
                  : "bg-emerald-600";
              return (
                <div key={s.session_number} className="flex items-center gap-3">
                  <span className="w-12 shrink-0 text-xs text-coc-muted text-right">
                    #{s.session_number}
                  </span>
                  <div className="flex-1 rounded-full bg-coc-raised h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${barColor}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-20 shrink-0 text-xs text-coc-muted text-right">
                    {s.san_remaining}
                    {s.san_loss > 0 && (
                      <span className="text-red-400 ml-1">(-{s.san_loss})</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 狂気記録 */}
      <div className="rounded-lg border border-coc-border bg-coc-surface p-4 mb-6">
        <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest mb-4">
          狂気記録
        </h2>
        <MadnessList characterId={id} initialRecords={madnessRecords ?? []} />
      </div>

      {/* フォビア・マニア */}
      <div className="rounded-lg border border-coc-border bg-coc-surface p-4">
        <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest mb-4">
          恐怖症・マニア
        </h2>
        <PhobiaList characterId={id} initialPhobias={phobias ?? []} />
      </div>
    </div>
  );
}
