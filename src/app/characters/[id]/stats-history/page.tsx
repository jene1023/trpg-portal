"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase, isSupabaseConfigured, CharacterStatSnapshot, GrowthHistory } from "@/lib/supabase";

type Props = { params: Promise<{ id: string }> };

const W = 500;
const H = 160;
const PAD_L = 36;
const PAD_R = 16;
const PAD_T = 14;
const PAD_B = 28;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;
const SKILL_COLORS = ["#d4a832", "#ef4444", "#818cf8", "#34d399", "#f472b6", "#f97316", "#22d3ee"];

type Point = { x: number; y: number; value: number; label: string };

function buildSnapPoints(snaps: CharacterStatSnapshot[], key: "hp_current" | "san_current", max: number): Point[] {
  const n = snaps.length;
  return snaps.map((s, i) => ({
    x: PAD_L + (n === 1 ? PLOT_W / 2 : (i / (n - 1)) * PLOT_W),
    y: PAD_T + PLOT_H - (Math.min(s[key], max) / Math.max(max, 1)) * PLOT_H,
    value: s[key],
    label: s.session_label ?? `#${i + 1}`,
  }));
}

function buildSkillPoints(histories: GrowthHistory[], skillName: string): Point[] {
  const entries = histories
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
    y: PAD_T + PLOT_H - (Math.min(v.value, 100) / 100) * PLOT_H,
    value: v.value,
    label: v.label,
  }));
}

function LineGraph({ pts, stroke, label, max }: { pts: Point[]; stroke: string; label: string; max: number }) {
  if (pts.length === 0) return null;
  const polyPts = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaFirst = `${pts[0].x.toFixed(1)},${(PAD_T + PLOT_H).toFixed(1)}`;
  const areaLast = `${pts[pts.length - 1].x.toFixed(1)},${(PAD_T + PLOT_H).toFixed(1)}`;
  const halfY = (PAD_T + PLOT_H / 2).toFixed(1);
  const bottomY = (PAD_T + PLOT_H).toFixed(1);
  const halfMax = Math.round(max / 2);

  return (
    <div className="rounded-lg border border-coc-border bg-coc-surface p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-coc-text">{label}</h3>
        <span className="text-xs text-coc-muted">最大 {max}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-label={`${label}の推移グラフ`}>
        <line x1={PAD_L} y1={PAD_T} x2={W - PAD_R} y2={PAD_T} stroke="#555" strokeOpacity={0.4} />
        <line x1={PAD_L} y1={halfY} x2={W - PAD_R} y2={halfY} stroke="#555" strokeOpacity={0.25} strokeDasharray="4 4" />
        <line x1={PAD_L} y1={bottomY} x2={W - PAD_R} y2={bottomY} stroke="#555" strokeOpacity={0.4} />
        <text x={PAD_L - 4} y={PAD_T + 4} textAnchor="end" fill="#888" fontSize={9}>{max}</text>
        <text x={PAD_L - 4} y={Number(halfY) + 4} textAnchor="end" fill="#888" fontSize={9}>{halfMax}</text>
        <text x={PAD_L - 4} y={Number(bottomY) + 4} textAnchor="end" fill="#888" fontSize={9}>0</text>
        {pts.length > 1 && (
          <polygon points={[areaFirst, polyPts, areaLast].join(" ")} fill={stroke} fillOpacity={0.12} />
        )}
        {pts.length > 1 && (
          <polyline points={polyPts} fill="none" stroke={stroke} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        )}
        {pts.map((p, i) => (
          <g key={i}>
            <title>{p.label}: {p.value}</title>
            <circle cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r={4} fill={stroke} stroke="#111827" strokeWidth={1.5} />
          </g>
        ))}
        {pts.map((p, i) => {
          const show = i === 0 || i === pts.length - 1 || pts.length <= 6;
          if (!show) return null;
          const text = p.label.length > 8 ? p.label.slice(0, 7) + "…" : p.label;
          return (
            <text key={i} x={p.x.toFixed(1)} y={H - 4}
              textAnchor={i === 0 ? "start" : i === pts.length - 1 ? "end" : "middle"}
              fill="#777" fontSize={9}>
              {text}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function MultiSkillGraph({ skillNames, histories }: { skillNames: string[]; histories: GrowthHistory[] }) {
  if (skillNames.length === 0) return null;
  const bottomY = (PAD_T + PLOT_H).toFixed(1);
  const halfY = (PAD_T + PLOT_H / 2).toFixed(1);

  return (
    <div className="rounded-lg border border-coc-border bg-coc-surface p-4">
      <h3 className="text-sm font-semibold text-coc-text mb-3">スキル成長推移（上位{skillNames.length}件）</h3>
      <div className="flex flex-wrap gap-2 mb-3">
        {skillNames.map((name, i) => (
          <span key={name} className="flex items-center gap-1.5 text-xs text-coc-muted">
            <span className="inline-block w-3 h-1 rounded" style={{ backgroundColor: SKILL_COLORS[i % SKILL_COLORS.length] }} />
            {name}
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-label="スキル成長推移グラフ">
        <line x1={PAD_L} y1={PAD_T} x2={W - PAD_R} y2={PAD_T} stroke="#555" strokeOpacity={0.4} />
        <line x1={PAD_L} y1={halfY} x2={W - PAD_R} y2={halfY} stroke="#555" strokeOpacity={0.25} strokeDasharray="4 4" />
        <line x1={PAD_L} y1={bottomY} x2={W - PAD_R} y2={bottomY} stroke="#555" strokeOpacity={0.4} />
        <text x={PAD_L - 4} y={PAD_T + 4} textAnchor="end" fill="#888" fontSize={9}>100</text>
        <text x={PAD_L - 4} y={Number(halfY) + 4} textAnchor="end" fill="#888" fontSize={9}>50</text>
        <text x={PAD_L - 4} y={Number(bottomY) + 4} textAnchor="end" fill="#888" fontSize={9}>0</text>
        {skillNames.map((name, si) => {
          const stroke = SKILL_COLORS[si % SKILL_COLORS.length];
          const pts = buildSkillPoints(histories, name);
          if (pts.length < 2) return null;
          const polyPts = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
          return (
            <g key={name}>
              <polyline points={polyPts} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
              {pts.map((p, i) => (
                <g key={i}>
                  <title>{name} ({p.label}): {p.value}</title>
                  <circle cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r={3} fill={stroke} stroke="#111827" strokeWidth={1} />
                </g>
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function StatsHistoryPage({ params }: Props) {
  const [characterId, setCharacterId] = useState("");
  const [characterName, setCharacterName] = useState("");
  const [hpMax, setHpMax] = useState(0);
  const [sanMax, setSanMax] = useState(0);
  const [snapshots, setSnapshots] = useState<CharacterStatSnapshot[]>([]);
  const [growthHistories, setGrowthHistories] = useState<GrowthHistory[]>([]);
  const [topSkills, setTopSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(({ id }) => {
      setCharacterId(id);
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }
      Promise.all([
        supabase.from("characters").select("id, name, hp_max, san_max").eq("id", id).single(),
        supabase.from("character_stat_snapshots").select("*").eq("character_id", id).order("snapshot_at", { ascending: true }),
        supabase.from("growth_histories").select("*").eq("character_id", id).order("grown_at", { ascending: true }),
      ]).then(([charRes, snapRes, growthRes]) => {
        if (charRes.data) {
          setCharacterName(charRes.data.name);
          setHpMax(charRes.data.hp_max);
          setSanMax(charRes.data.san_max);
        }
        const snaps = snapRes.data ?? [];
        const histories = growthRes.data ?? [];
        setSnapshots(snaps);
        setGrowthHistories(histories);

        // Top skills by total growth amount
        const growthBySkill: Record<string, number> = {};
        for (const h of histories) {
          growthBySkill[h.skill_name] = (growthBySkill[h.skill_name] ?? 0) + (h.new_value - h.old_value);
        }
        const sorted = Object.entries(growthBySkill)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name]) => name);
        setTopSkills(sorted);
        setLoading(false);
      });
    });
  }, []);

  const hpPts = buildSnapPoints(snapshots, "hp_current", hpMax || 1);
  const sanPts = buildSnapPoints(snapshots, "san_current", sanMax || 1);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/characters/${characterId}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          {characterName || "キャラクター"}
        </Link>
      </div>

      <h1 className="font-cinzel text-xl font-bold text-coc-text mb-1">
        📈 成長グラフ
      </h1>
      <p className="text-xs text-coc-muted mb-8">
        セッションごとのHP・SAN推移と主要スキルの成長を可視化します。
      </p>

      {loading ? (
        <div className="text-center py-16 text-coc-muted text-sm">読み込み中...</div>
      ) : snapshots.length === 0 && growthHistories.length === 0 ? (
        <div className="rounded-lg border border-coc-border bg-coc-surface p-8 text-center space-y-3">
          <p className="text-coc-muted text-sm">まだデータがありません。</p>
          <p className="text-xs text-coc-muted">
            セッション終了処理を実行するとHP・SANのスナップショットが記録されます。
          </p>
          <Link
            href={`/characters/${characterId}/session-end`}
            className="inline-block text-coc-gold text-sm hover:underline"
          >
            セッション終了処理へ →
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {snapshots.length > 0 && (
            <>
              <LineGraph pts={hpPts} stroke="#ef4444" label="HP 耐久力" max={hpMax} />
              <LineGraph pts={sanPts} stroke="#818cf8" label="SAN 正気度" max={sanMax} />
            </>
          )}

          {topSkills.length > 0 && (
            <MultiSkillGraph skillNames={topSkills} histories={growthHistories} />
          )}

          {growthHistories.length > 0 && topSkills.length === 0 && (
            <div className="rounded-lg border border-coc-border bg-coc-surface p-4 text-sm text-coc-muted text-center">
              成長履歴はありますが、グラフ表示に十分なデータがありません。
            </div>
          )}

          {snapshots.length > 0 && (
            <div className="rounded-lg border border-coc-border bg-coc-surface overflow-hidden">
              <div className="px-4 py-3 border-b border-coc-border">
                <h2 className="text-sm font-semibold text-coc-text">スナップショット一覧 ({snapshots.length}件)</h2>
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
                    {snapshots.map((s) => (
                      <tr key={s.id} className="border-b border-coc-border last:border-0 hover:bg-coc-raised/40 transition-colors">
                        <td className="px-4 py-2 text-coc-text">{s.session_label ?? "—"}</td>
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
          )}
        </div>
      )}
    </div>
  );
}
