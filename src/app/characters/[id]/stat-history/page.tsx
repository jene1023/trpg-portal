export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase, isSupabaseConfigured, CharacterStatSnapshot } from "@/lib/supabase";

type Props = { params: Promise<{ id: string }> };

const W = 500;
const H = 160;
const PAD_L = 36;
const PAD_R = 16;
const PAD_T = 14;
const PAD_B = 28;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;

function buildPoints(
  snaps: CharacterStatSnapshot[],
  key: "hp_current" | "san_current" | "luck",
  max: number
) {
  const n = snaps.length;
  return snaps.map((s, i) => ({
    x: PAD_L + (n === 1 ? PLOT_W / 2 : (i / (n - 1)) * PLOT_W),
    y: PAD_T + PLOT_H - (Math.min(s[key], max) / Math.max(max, 1)) * PLOT_H,
    value: s[key],
    label: s.session_label ?? `#${i + 1}`,
  }));
}

function StatLineGraph({
  snaps,
  statKey,
  label,
  max,
  stroke,
}: {
  snaps: CharacterStatSnapshot[];
  statKey: "hp_current" | "san_current" | "luck";
  label: string;
  max: number;
  stroke: string;
}) {
  const pts = buildPoints(snaps, statKey, max);
  const polyPts = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaFirst = `${pts[0].x.toFixed(1)},${(PAD_T + PLOT_H).toFixed(1)}`;
  const areaLast = `${pts[pts.length - 1].x.toFixed(1)},${(PAD_T + PLOT_H).toFixed(1)}`;
  const halfMax = Math.round(max / 2);
  const halfY = (PAD_T + PLOT_H / 2).toFixed(1);
  const bottomY = (PAD_T + PLOT_H).toFixed(1);

  return (
    <div className="rounded-lg border border-coc-border bg-coc-surface p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-coc-text">{label}</h3>
        <span className="text-xs text-coc-muted">最大 {max}</span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        aria-label={`${label}の推移グラフ`}
      >
        {/* grid lines */}
        <line x1={PAD_L} y1={PAD_T} x2={W - PAD_R} y2={PAD_T} stroke="#555" strokeOpacity={0.4} />
        <line x1={PAD_L} y1={halfY} x2={W - PAD_R} y2={halfY} stroke="#555" strokeOpacity={0.25} strokeDasharray="4 4" />
        <line x1={PAD_L} y1={bottomY} x2={W - PAD_R} y2={bottomY} stroke="#555" strokeOpacity={0.4} />

        {/* y-axis labels */}
        <text x={PAD_L - 4} y={PAD_T + 4} textAnchor="end" fill="#888" fontSize={9}>{max}</text>
        <text x={PAD_L - 4} y={Number(halfY) + 4} textAnchor="end" fill="#888" fontSize={9}>{halfMax}</text>
        <text x={PAD_L - 4} y={Number(bottomY) + 4} textAnchor="end" fill="#888" fontSize={9}>0</text>

        {/* filled area */}
        {pts.length > 1 && (
          <polygon
            points={[areaFirst, polyPts, areaLast].join(" ")}
            fill={stroke}
            fillOpacity={0.12}
          />
        )}

        {/* polyline */}
        {pts.length > 1 && (
          <polyline
            points={polyPts}
            fill="none"
            stroke={stroke}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {/* data points */}
        {pts.map((p, i) => (
          <g key={i}>
            <title>{p.label}: {p.value}</title>
            <circle
              cx={p.x.toFixed(1)}
              cy={p.y.toFixed(1)}
              r={4}
              fill={stroke}
              stroke="#111827"
              strokeWidth={1.5}
            />
          </g>
        ))}

        {/* x-axis labels: first, last, and intermediate when ≤6 points */}
        {pts.map((p, i) => {
          const show = i === 0 || i === pts.length - 1 || pts.length <= 6;
          if (!show) return null;
          const text = p.label.length > 8 ? p.label.slice(0, 7) + "…" : p.label;
          return (
            <text
              key={i}
              x={p.x.toFixed(1)}
              y={H - 4}
              textAnchor={i === 0 ? "start" : i === pts.length - 1 ? "end" : "middle"}
              fill="#777"
              fontSize={9}
            >
              {text}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

export default async function StatHistoryPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: char } = await supabase
    .from("characters")
    .select("id, name, hp_max, san_max")
    .eq("id", id)
    .single();

  if (!char) notFound();

  const { data: snapshots } = await supabase
    .from("character_stat_snapshots")
    .select("*")
    .eq("character_id", id)
    .order("snapshot_at", { ascending: true });

  const snaps: CharacterStatSnapshot[] = snapshots ?? [];

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

      <h1 className="font-cinzel text-xl font-bold text-coc-text mb-1">
        能力値推移グラフ
      </h1>
      <p className="text-xs text-coc-muted mb-8">
        セッション終了時のHP・SAN・幸運の変化を可視化します。各点にカーソルを合わせるとセッション名が表示されます。
      </p>

      {snaps.length === 0 ? (
        <div className="rounded-lg border border-coc-border bg-coc-surface p-8 text-center space-y-3">
          <p className="text-coc-muted text-sm">まだスナップショットがありません。</p>
          <p className="text-xs text-coc-muted">
            セッション終了処理を実行するたびに自動的に記録されます。
          </p>
          <Link
            href={`/characters/${id}/session-end`}
            className="inline-block text-coc-gold text-sm hover:underline"
          >
            セッション終了処理へ →
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <StatLineGraph
            snaps={snaps}
            statKey="hp_current"
            label="HP 耐久力"
            max={char.hp_max}
            stroke="#ef4444"
          />
          <StatLineGraph
            snaps={snaps}
            statKey="san_current"
            label="SAN 正気度"
            max={char.san_max}
            stroke="#818cf8"
          />
          <StatLineGraph
            snaps={snaps}
            statKey="luck"
            label="幸運"
            max={100}
            stroke="#d4a832"
          />

          <div className="rounded-lg border border-coc-border bg-coc-surface overflow-hidden">
            <div className="px-4 py-3 border-b border-coc-border">
              <h2 className="text-sm font-semibold text-coc-text">
                スナップショット一覧 ({snaps.length}件)
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-coc-border">
                    <th className="text-left px-4 py-2 text-xs text-coc-muted font-medium">セッション</th>
                    <th className="text-right px-4 py-2 text-xs text-red-400 font-medium">HP</th>
                    <th className="text-right px-4 py-2 text-xs text-indigo-400 font-medium">SAN</th>
                    <th className="text-right px-4 py-2 text-xs text-coc-gold font-medium">幸運</th>
                    <th className="text-right px-4 py-2 text-xs text-coc-muted font-medium">記録日</th>
                  </tr>
                </thead>
                <tbody>
                  {snaps.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b border-coc-border last:border-0 hover:bg-coc-raised/40 transition-colors"
                    >
                      <td className="px-4 py-2 text-coc-text text-sm">{s.session_label ?? "—"}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-red-400">{s.hp_current}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-indigo-400">{s.san_current}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-coc-gold">{s.luck}</td>
                      <td className="px-4 py-2 text-right text-xs text-coc-muted">
                        {new Date(s.snapshot_at).toLocaleDateString("ja-JP")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
