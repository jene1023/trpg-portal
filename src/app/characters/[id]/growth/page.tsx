export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { supabase, isSupabaseConfigured, GrowthHistory } from "@/lib/supabase";
import GrowthHistoryList from "@/app/_components/GrowthHistoryList";

type Props = { params: Promise<{ id: string }> };

const W = 500;
const H = 150;
const PAD_L = 36;
const PAD_R = 16;
const PAD_T = 16;
const PAD_B = 24;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;
const MAX_VAL = 100;
const SKILL_COLORS = ["#d4a832", "#ef4444", "#818cf8", "#34d399", "#f472b6"];

type SkillPoint = { x: number; y: number; value: number; label: string };

function buildSkillPoints(history: GrowthHistory[], skillName: string): SkillPoint[] {
  const entries = history
    .filter((h) => h.skill_name === skillName)
    .sort((a, b) => (a.grown_at ?? a.created_at).localeCompare(b.grown_at ?? b.created_at));

  if (entries.length === 0) return [];

  const values: Array<{ value: number; label: string }> = [
    { value: entries[0].old_value, label: "開始" },
  ];
  for (const e of entries) {
    values.push({
      value: e.new_value,
      label: e.session_label ?? new Date(e.grown_at ?? e.created_at).toLocaleDateString("ja-JP"),
    });
  }

  const n = values.length;
  return values.map((v, i) => ({
    x: PAD_L + (n === 1 ? PLOT_W / 2 : (i / (n - 1)) * PLOT_W),
    y: PAD_T + PLOT_H - (Math.min(v.value, MAX_VAL) / MAX_VAL) * PLOT_H,
    value: v.value,
    label: v.label,
  }));
}

function SkillLineGraph({ name, color, pts }: { name: string; color: string; pts: SkillPoint[] }) {
  if (pts.length < 2) return null;
  const polyPts = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaFirst = `${pts[0].x.toFixed(1)},${(PAD_T + PLOT_H).toFixed(1)}`;
  const areaLast = `${pts[pts.length - 1].x.toFixed(1)},${(PAD_T + PLOT_H).toFixed(1)}`;
  const bottomY = (PAD_T + PLOT_H).toFixed(1);
  const start = pts[0].value;
  const end = pts[pts.length - 1].value;
  const gain = end - start;

  return (
    <div className="rounded-lg border border-coc-border bg-coc-surface p-3">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-4 h-1 rounded-full" style={{ background: color }} />
        <span className="text-sm font-semibold text-coc-text">{name}</span>
        <span className="ml-auto text-xs text-coc-muted">
          {start} → {end}
          {gain > 0 && <span className="ml-1 text-coc-gold">+{gain}</span>}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-label={`${name}の成長グラフ`}>
        <line x1={PAD_L} y1={PAD_T} x2={W - PAD_R} y2={PAD_T} stroke="#555" strokeOpacity={0.35} />
        <line x1={PAD_L} y1={bottomY} x2={W - PAD_R} y2={bottomY} stroke="#555" strokeOpacity={0.35} />
        <text x={PAD_L - 4} y={PAD_T + 4} textAnchor="end" fill="#888" fontSize={9}>100</text>
        <text x={PAD_L - 4} y={Number(bottomY) + 4} textAnchor="end" fill="#888" fontSize={9}>0</text>
        <polygon
          points={`${areaFirst} ${polyPts} ${areaLast}`}
          fill={color}
          fillOpacity={0.1}
        />
        <polyline
          points={polyPts}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {pts.map((p, i) => (
          <g key={i}>
            <title>{p.label}: {p.value}</title>
            <circle
              cx={p.x.toFixed(1)}
              cy={p.y.toFixed(1)}
              r={4}
              fill={color}
              stroke="#111827"
              strokeWidth={1.5}
            />
          </g>
        ))}
        {pts.map((p, i) => {
          const show = i === 0 || i === pts.length - 1 || pts.length <= 5;
          if (!show) return null;
          const text = p.label.length > 8 ? p.label.slice(0, 7) + "…" : p.label;
          return (
            <text
              key={i}
              x={p.x.toFixed(1)}
              y={H - 2}
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

export default async function GrowthPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: char } = await supabase
    .from("characters")
    .select("id, name")
    .eq("id", id)
    .single();

  if (!char) notFound();

  const { data: history } = await supabase
    .from("growth_history")
    .select("*")
    .eq("character_id", id)
    .order("grown_at", { ascending: true });

  const allHistory: GrowthHistory[] = history ?? [];

  // Pick top 5 skills by total gain
  const skillGains: Record<string, number> = {};
  for (const h of allHistory) {
    skillGains[h.skill_name] = (skillGains[h.skill_name] ?? 0) + (h.new_value - h.old_value);
  }
  const topSkills = Object.entries(skillGains)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name]) => name);

  const skillSeries = topSkills.map((name, i) => ({
    name,
    color: SKILL_COLORS[i % SKILL_COLORS.length],
    pts: buildSkillPoints(allHistory, name),
  }));

  const sortedForList = [...allHistory].sort((a, b) =>
    (b.grown_at ?? b.created_at).localeCompare(a.grown_at ?? a.created_at)
  );

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

      <div className="flex items-center justify-between mb-1">
        <h1 className="font-cinzel text-xl font-bold text-coc-text">
          技能成長グラフ
        </h1>
        <Link
          href={`/characters/${id}/growth-advisor`}
          className="flex items-center gap-1.5 rounded-lg border border-coc-gold bg-coc-gold/10 px-3 py-1.5 text-xs font-semibold text-coc-gold hover:bg-coc-gold/20 transition-colors"
        >
          <Sparkles size={13} />
          AIアドバイス
        </Link>
      </div>
      <p className="text-xs text-coc-muted mb-6">
        セッションごとの技能値変遷を折れ線グラフで可視化します。各点にカーソルを合わせるとセッション名が表示されます。
      </p>

      {skillSeries.length > 0 && (
        <div className="space-y-4 mb-8">
          <h2 className="text-xs text-coc-muted font-semibold uppercase tracking-widest">
            成長上位技能（最大5件）
          </h2>
          {skillSeries.map((s) => (
            <SkillLineGraph key={s.name} name={s.name} color={s.color} pts={s.pts} />
          ))}
        </div>
      )}

      <GrowthHistoryList characterId={id} initialHistory={sortedForList} />
    </div>
  );
}
