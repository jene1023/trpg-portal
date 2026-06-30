export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase, isSupabaseConfigured, SessionLog } from "@/lib/supabase";

type Props = { params: Promise<{ id: string }> };

type GraphPoint = {
  sessionNumber: number;
  title: string;
  hpPct: number;
  sanPct: number;
  hpRemaining: number;
  sanRemaining: number;
};

function barColor(pct: number): string {
  if (pct <= 25) return "bg-red-600";
  if (pct <= 50) return "bg-yellow-600";
  return "bg-coc-gold";
}

export default async function StatsGraphPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: char } = await supabase
    .from("characters")
    .select("id, name, hp_max, san_max")
    .eq("id", id)
    .single();

  if (!char) notFound();

  const { data: sessions } = await supabase
    .from("sessions")
    .select("*")
    .eq("character_id", id)
    .order("session_number", { ascending: true });

  const logs: SessionLog[] = sessions ?? [];

  let cumulativeHpLoss = 0;
  let cumulativeSanLoss = 0;
  const points: GraphPoint[] = logs.map((log) => {
    cumulativeHpLoss += log.hp_loss;
    cumulativeSanLoss += log.san_loss;
    const hpRemaining = Math.max(0, char.hp_max - cumulativeHpLoss);
    const sanRemaining = Math.max(0, char.san_max - cumulativeSanLoss);
    return {
      sessionNumber: log.session_number,
      title: log.title,
      hpRemaining,
      sanRemaining,
      hpPct: char.hp_max > 0 ? Math.round((hpRemaining / char.hp_max) * 100) : 0,
      sanPct: char.san_max > 0 ? Math.round((sanRemaining / char.san_max) * 100) : 0,
    };
  });

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

      <h1 className="font-cinzel text-xl font-bold text-coc-text mb-8">
        HP/SAN推移グラフ
      </h1>

      {points.length === 0 ? (
        <div className="rounded-lg border border-coc-border bg-coc-surface p-8 text-center text-coc-muted text-sm">
          セッションログがまだありません。
          <br />
          <Link
            href={`/characters/${id}/sessions`}
            className="mt-3 inline-block text-coc-gold hover:underline"
          >
            セッションログを追加する →
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          <GraphSection
            label="HP推移"
            points={points}
            valueKey="hpPct"
            remainingKey="hpRemaining"
            max={char.hp_max}
          />
          <GraphSection
            label="SAN推移"
            points={points}
            valueKey="sanPct"
            remainingKey="sanRemaining"
            max={char.san_max}
          />
        </div>
      )}
    </div>
  );
}

function GraphSection({
  label,
  points,
  valueKey,
  remainingKey,
  max,
}: {
  label: string;
  points: GraphPoint[];
  valueKey: "hpPct" | "sanPct";
  remainingKey: "hpRemaining" | "sanRemaining";
  max: number;
}) {
  return (
    <div className="rounded-lg border border-coc-border bg-coc-surface p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-cinzel text-sm font-semibold text-coc-text">
          {label}
        </h2>
        <span className="text-xs text-coc-muted">最大値 {max}</span>
      </div>

      <div className="flex items-end gap-2 h-40">
        {points.map((p) => (
          <div
            key={p.sessionNumber}
            className="flex-1 flex flex-col items-center justify-end h-full"
          >
            <span className="text-[10px] text-coc-muted mb-1">
              {p[remainingKey]}
            </span>
            <div className="w-full bg-coc-bg rounded-t-sm overflow-hidden flex items-end h-full">
              <div
                className={`w-full rounded-t-sm transition-all ${barColor(p[valueKey])}`}
                style={{ height: `${p[valueKey]}%` }}
              />
            </div>
            <span className="text-[10px] text-coc-muted mt-1 whitespace-nowrap">
              #{p.sessionNumber}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
