export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft, Brain } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type Props = { params: Promise<{ id: string }> };

const CHAR_COLORS = [
  "#b8860b", "#7c3aed", "#0891b2", "#16a34a",
  "#dc2626", "#ea580c", "#d97706", "#0284c7",
  "#db2777", "#059669",
];

type SanPoint = { sessionNumber: number; sanValue: number };

type CharSanData = {
  id: string;
  name: string;
  sanStart: number;
  sanMax: number;
  sanCurrent: number;
  points: SanPoint[];
  color: string;
  isWarning: boolean;
};

const W = 600;
const H = 260;
const PAD_L = 38;
const PAD_R = 16;
const PAD_T = 16;
const PAD_B = 30;
const INNER_W = W - PAD_L - PAD_R;
const INNER_H = H - PAD_T - PAD_B;

function toX(sessionNum: number, maxNum: number): number {
  if (maxNum === 0) return PAD_L;
  return PAD_L + (sessionNum / maxNum) * INNER_W;
}

function toY(sanVal: number, maxSan: number): number {
  if (maxSan === 0) return PAD_T + INNER_H;
  return PAD_T + INNER_H - (Math.min(sanVal, maxSan) / maxSan) * INNER_H;
}

function buildPath(points: SanPoint[], maxNum: number, maxSan: number): string {
  if (points.length === 0) return "";
  return points
    .map((p, i) => {
      const x = toX(p.sessionNumber, maxNum).toFixed(1);
      const y = toY(p.sanValue, maxSan).toFixed(1);
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");
}

function sanBarColor(pct: number): string {
  if (pct <= 30) return "bg-red-500";
  if (pct <= 60) return "bg-yellow-500";
  return "bg-coc-gold";
}

export default async function CampaignSanGraphPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 text-center text-coc-muted">
        Supabase が未設定です。
      </div>
    );
  }

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, title")
    .eq("id", id)
    .single();

  if (!campaign) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 text-center text-coc-muted">
        キャンペーンが見つかりません。
      </div>
    );
  }

  const { data: links } = await supabase
    .from("campaign_scenarios")
    .select("scenario_id")
    .eq("campaign_id", id);

  const scenarioIds: string[] = (links ?? []).map((l) => l.scenario_id as string);

  if (scenarioIds.length === 0) {
    return <EmptyState title={campaign.title as string} campaignId={id} />;
  }

  const { data: participantRows } = await supabase
    .from("scenario_participants")
    .select("character_id")
    .in("scenario_id", scenarioIds);

  const charIds = [
    ...new Set((participantRows ?? []).map((p) => p.character_id as string)),
  ];

  if (charIds.length === 0) {
    return <EmptyState title={campaign.title as string} campaignId={id} />;
  }

  const [{ data: characters }, { data: sessions }] = await Promise.all([
    supabase
      .from("characters")
      .select("id, name, san_start, san_current, san_max")
      .in("id", charIds),
    supabase
      .from("sessions")
      .select("character_id, session_number, san_loss")
      .in("character_id", charIds)
      .order("session_number", { ascending: true }),
  ]);

  const charList = characters ?? [];
  const sessionList = sessions ?? [];

  const charDataList: CharSanData[] = charList.map((char, i) => {
    const charSessions = sessionList
      .filter((s) => s.character_id === char.id)
      .sort((a, b) => ((a.session_number as number) ?? 0) - ((b.session_number as number) ?? 0));

    const sanStart = (char.san_start as number) || (char.san_max as number) || 50;
    let cumLoss = 0;
    const points: SanPoint[] = [{ sessionNumber: 0, sanValue: sanStart }];

    for (const sess of charSessions) {
      cumLoss += (sess.san_loss as number) ?? 0;
      points.push({
        sessionNumber: (sess.session_number as number) ?? points.length,
        sanValue: Math.max(0, sanStart - cumLoss),
      });
    }

    const sanCurrent = (char.san_current as number) ?? 0;
    const isWarning = sanStart > 0 && sanCurrent <= sanStart * 0.3;

    return {
      id: char.id as string,
      name: char.name as string,
      sanStart,
      sanMax: (char.san_max as number) || sanStart,
      sanCurrent,
      points,
      color: CHAR_COLORS[i % CHAR_COLORS.length],
      isWarning,
    };
  });

  const allPoints = charDataList.flatMap((c) => c.points);
  const maxSessionNum = allPoints.reduce((m, p) => Math.max(m, p.sessionNumber), 0);
  const maxSan = charDataList.reduce((m, c) => Math.max(m, c.sanStart, c.sanMax), 1);

  const hasData = maxSessionNum > 0;

  const yTickValues = [0, Math.round(maxSan * 0.25), Math.round(maxSan * 0.5), Math.round(maxSan * 0.75), maxSan];
  const uniqueYTicks = [...new Set(yTickValues)];

  const xTickStep = maxSessionNum <= 10 ? 1 : Math.ceil(maxSessionNum / 10);
  const xTicks: number[] = [];
  for (let t = 0; t <= maxSessionNum; t += xTickStep) xTicks.push(t);

  const warningChars = charDataList.filter((c) => c.isWarning);

  return (
    <div className="coc-page-enter mx-auto max-w-3xl px-4 py-8">
      <Link
        href={`/campaigns/${id}`}
        className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        キャンペーン詳細に戻る
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <Brain size={22} className="text-coc-gold shrink-0" />
        <h1 className="font-cinzel text-2xl font-bold text-coc-text">
          {campaign.title as string} — SAN推移グラフ
        </h1>
      </div>

      {warningChars.length > 0 && (
        <div className="mb-6 rounded-xl border border-red-800 bg-red-900/20 px-5 py-4">
          <p className="text-sm font-semibold text-red-400 mb-2">⚠ SAN 警告</p>
          <p className="text-xs text-coc-muted mb-2">
            現在SANが初期値の30%以下の探索者:
          </p>
          <ul className="flex flex-wrap gap-2">
            {warningChars.map((c) => (
              <li
                key={c.id}
                className="rounded-full border border-red-800 bg-red-900/30 px-3 py-0.5 text-xs text-red-300"
              >
                {c.name}（SAN {c.sanCurrent} / 初期 {c.sanStart}）
              </li>
            ))}
          </ul>
        </div>
      )}

      {!hasData ? (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-10 text-center text-coc-muted text-sm">
          セッションデータがまだありません。
          <br />
          各キャラクターのセッションログを記録すると、ここにSAN推移グラフが表示されます。
        </div>
      ) : (
        <>
          <div className="mb-6 rounded-xl border border-coc-border bg-coc-surface p-4 overflow-x-auto">
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="w-full"
              style={{ minWidth: "320px" }}
              aria-label="SAN推移グラフ"
            >
              {/* Y gridlines and labels */}
              {uniqueYTicks.map((tick) => {
                const y = toY(tick, maxSan).toFixed(1);
                return (
                  <g key={tick}>
                    <line
                      x1={PAD_L}
                      y1={y}
                      x2={W - PAD_R}
                      y2={y}
                      stroke="#2a2a2a"
                      strokeWidth="1"
                    />
                    <text
                      x={PAD_L - 5}
                      y={parseFloat(y) + 4}
                      textAnchor="end"
                      fontSize="10"
                      fill="#6b7280"
                    >
                      {tick}
                    </text>
                  </g>
                );
              })}

              {/* X labels */}
              {xTicks.filter((t) => t > 0).map((tick) => (
                <text
                  key={tick}
                  x={toX(tick, maxSessionNum).toFixed(1)}
                  y={H - PAD_B + 14}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#6b7280"
                >
                  {`#${tick}`}
                </text>
              ))}

              {/* Axis lines */}
              <line
                x1={PAD_L}
                y1={PAD_T}
                x2={PAD_L}
                y2={H - PAD_B}
                stroke="#3a3a3a"
                strokeWidth="1"
              />
              <line
                x1={PAD_L}
                y1={H - PAD_B}
                x2={W - PAD_R}
                y2={H - PAD_B}
                stroke="#3a3a3a"
                strokeWidth="1"
              />

              {/* Character lines */}
              {charDataList.map((char) => (
                <g key={char.id}>
                  <path
                    d={buildPath(char.points, maxSessionNum, maxSan)}
                    fill="none"
                    stroke={char.color}
                    strokeWidth={char.isWarning ? "2.5" : "2"}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.9"
                  />
                  {char.points.map((p, pi) => (
                    <circle
                      key={pi}
                      cx={toX(p.sessionNumber, maxSessionNum).toFixed(1)}
                      cy={toY(p.sanValue, maxSan).toFixed(1)}
                      r="3"
                      fill={char.color}
                      opacity="0.85"
                    />
                  ))}
                </g>
              ))}
            </svg>
          </div>

          {/* Legend */}
          <div className="mb-6 flex flex-wrap gap-2">
            {charDataList.map((char) => (
              <div
                key={char.id}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
                  char.isWarning
                    ? "border-red-800 bg-red-900/20"
                    : "border-coc-border bg-coc-surface"
                }`}
              >
                <span
                  className="inline-block w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: char.color }}
                />
                <span className="text-coc-text font-medium">{char.name}</span>
                <span className="text-coc-muted">
                  {char.sanCurrent} / {char.sanMax}
                </span>
                {char.isWarning && <span className="text-red-400">⚠</span>}
              </div>
            ))}
          </div>

          {/* Per-character SAN bar table */}
          <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-5">
            <p className="font-cinzel text-xs font-medium text-coc-muted uppercase tracking-widest mb-4">
              探索者 SAN 状況
            </p>
            <div className="flex flex-col gap-3">
              {charDataList.map((char) => {
                const pct =
                  char.sanStart > 0
                    ? Math.min(100, Math.round((char.sanCurrent / char.sanStart) * 100))
                    : 0;
                return (
                  <div key={char.id} className="flex items-center gap-3">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: char.color }}
                    />
                    <span className="w-24 shrink-0 text-xs text-coc-text truncate">
                      {char.name}
                    </span>
                    <div className="flex-1 h-3 bg-coc-raised rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${sanBarColor(pct)}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-20 shrink-0 text-right text-xs text-coc-muted">
                      {char.sanCurrent} / {char.sanStart}
                    </span>
                    <span
                      className="w-10 shrink-0 text-right text-xs font-semibold"
                      style={{ color: pct <= 30 ? "#ef4444" : "#9ca3af" }}
                    >
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function EmptyState({ title, campaignId }: { title: string; campaignId: string }) {
  return (
    <div className="coc-page-enter mx-auto max-w-3xl px-4 py-8">
      <Link
        href={`/campaigns/${campaignId}`}
        className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        キャンペーン詳細に戻る
      </Link>
      <div className="flex items-center gap-3 mb-6">
        <Brain size={22} className="text-coc-gold shrink-0" />
        <h1 className="font-cinzel text-2xl font-bold text-coc-text">
          {title} — SAN推移グラフ
        </h1>
      </div>
      <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-10 text-center text-coc-muted text-sm">
        シナリオまたは参加者が登録されていません。
        <br />
        キャンペーンにシナリオを追加し、参加者を登録してください。
      </div>
    </div>
  );
}
