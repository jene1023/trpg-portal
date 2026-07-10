"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BarChart2, TrendingUp } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type ScenarioStats = {
  scenarioId: string;
  title: string;
  count: number;
  avgFun: number;
  avgTension: number;
  avgFacilitation: number;
  wouldReplayPct: number;
};

type FeedbackRow = {
  scenario_id: string;
  fun_rating: number;
  tension_rating: number;
  facilitation_rating: number;
  would_replay: boolean;
};

function FeedbackBarChart({ stats }: { stats: ScenarioStats[] }) {
  if (stats.length === 0) return null;

  const barWidth = 18;
  const barGap = 3;
  const groupGap = 20;
  const groupWidth = barWidth * 3 + barGap * 2 + groupGap;
  const chartWidth = Math.max(360, stats.length * groupWidth + 60);
  const chartHeight = 160;
  const maxVal = 5;
  const yScale = (chartHeight - 20) / maxVal;

  const funColor = "#b8943f";
  const tensionColor = "#5b8dd9";
  const facilColor = "#4caf87";

  return (
    <div className="overflow-x-auto">
      <svg
        width={chartWidth}
        height={chartHeight + 56}
        aria-label="満足度バーチャート"
        className="text-coc-muted"
      >
        {[1, 2, 3, 4, 5].map((v) => (
          <g key={v}>
            <line
              x1={36}
              y1={chartHeight - v * yScale}
              x2={chartWidth - 8}
              y2={chartHeight - v * yScale}
              stroke="currentColor"
              strokeOpacity={0.12}
              strokeWidth={1}
            />
            <text
              x={30}
              y={chartHeight - v * yScale + 4}
              textAnchor="end"
              fontSize={9}
              fill="currentColor"
              fillOpacity={0.5}
            >
              {v}
            </text>
          </g>
        ))}

        {stats.map((s, i) => {
          const x = 44 + i * groupWidth;
          const labelX = x + (barWidth * 3 + barGap * 2) / 2;
          return (
            <g key={s.scenarioId}>
              <rect
                x={x}
                y={chartHeight - s.avgFun * yScale}
                width={barWidth}
                height={s.avgFun * yScale}
                fill={funColor}
                rx={2}
                opacity={0.85}
              />
              <rect
                x={x + barWidth + barGap}
                y={chartHeight - s.avgTension * yScale}
                width={barWidth}
                height={s.avgTension * yScale}
                fill={tensionColor}
                rx={2}
                opacity={0.85}
              />
              <rect
                x={x + (barWidth + barGap) * 2}
                y={chartHeight - s.avgFacilitation * yScale}
                width={barWidth}
                height={s.avgFacilitation * yScale}
                fill={facilColor}
                rx={2}
                opacity={0.85}
              />
              <text
                x={labelX}
                y={chartHeight + 12}
                textAnchor="middle"
                fontSize={8}
                fill="currentColor"
                fillOpacity={0.6}
              >
                {s.title.length > 8 ? s.title.slice(0, 7) + "…" : s.title}
              </text>
              <text
                x={labelX}
                y={chartHeight + 22}
                textAnchor="middle"
                fontSize={7}
                fill="currentColor"
                fillOpacity={0.4}
              >
                n={s.count}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="flex gap-4 mt-1 text-xs text-coc-muted flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded" style={{ background: funColor }} />
          楽しさ
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded" style={{ background: tensionColor }} />
          緊張感
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded" style={{ background: facilColor }} />
          ファシリテーション
        </span>
      </div>
    </div>
  );
}

export default function CampaignFeedbackStatsPage() {
  const params = useParams<{ id: string }>();
  const campaignId = params.id;

  const [campaignTitle, setCampaignTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ScenarioStats[]>([]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    (async () => {
      const [{ data: campaign }, { data: links }] = await Promise.all([
        supabase.from("campaigns").select("title").eq("id", campaignId).single(),
        supabase
          .from("campaign_scenarios")
          .select("scenario_id, scenarios(id, title)")
          .eq("campaign_id", campaignId)
          .order("order_index", { ascending: true }),
      ]);

      setCampaignTitle(campaign?.title ?? "");

      const scenarios = ((links ?? []) as unknown as { scenario_id: string; scenarios: { id: string; title: string } | null }[])
        .filter((l) => l.scenarios)
        .map((l) => l.scenarios as { id: string; title: string });

      if (scenarios.length === 0) {
        setLoading(false);
        return;
      }

      const scenarioIds = scenarios.map((s) => s.id);
      const { data: feedbacks } = await supabase
        .from("session_feedback")
        .select("scenario_id, fun_rating, tension_rating, facilitation_rating, would_replay")
        .in("scenario_id", scenarioIds);

      const byScenario = new Map<string, FeedbackRow[]>();
      for (const fb of (feedbacks ?? []) as FeedbackRow[]) {
        const arr = byScenario.get(fb.scenario_id) ?? [];
        arr.push(fb);
        byScenario.set(fb.scenario_id, arr);
      }

      const computed: ScenarioStats[] = scenarios.map((s) => {
        const fbs = byScenario.get(s.id) ?? [];
        const n = fbs.length;
        if (n === 0) {
          return {
            scenarioId: s.id,
            title: s.title,
            count: 0,
            avgFun: 0,
            avgTension: 0,
            avgFacilitation: 0,
            wouldReplayPct: 0,
          };
        }
        return {
          scenarioId: s.id,
          title: s.title,
          count: n,
          avgFun: fbs.reduce((acc, f) => acc + f.fun_rating, 0) / n,
          avgTension: fbs.reduce((acc, f) => acc + f.tension_rating, 0) / n,
          avgFacilitation: fbs.reduce((acc, f) => acc + f.facilitation_rating, 0) / n,
          wouldReplayPct: Math.round((fbs.filter((f) => f.would_replay).length / n) * 100),
        };
      });

      setStats(computed);
      setLoading(false);
    })();
  }, [campaignId]);

  const hasData = stats.some((s) => s.count > 0);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-sm text-coc-muted">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="coc-page-enter mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/campaigns/${campaignId}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          キャンペーン詳細
        </Link>
      </div>

      <div className="mb-6">
        <p className="text-xs text-coc-muted mb-1">{campaignTitle}</p>
        <h1 className="font-cinzel text-xl font-bold text-coc-text flex items-center gap-2">
          <TrendingUp size={20} className="text-coc-gold" />
          満足度フィードバック統計
        </h1>
        <p className="text-xs text-coc-muted mt-1">
          KP向け：全シナリオのPL満足度推移をグラフで確認できます。
        </p>
      </div>

      {!isSupabaseConfigured ? (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-8 text-center">
          <p className="text-coc-muted text-sm">Supabaseが設定されていません。</p>
        </div>
      ) : !hasData ? (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-8 text-center">
          <BarChart2 size={32} className="text-coc-border mx-auto mb-3" />
          <p className="text-coc-muted text-sm">まだフィードバックデータがありません。</p>
          <p className="text-xs text-coc-muted mt-1">
            各シナリオの
            <span className="text-coc-gold mx-1">フィードバックページ</span>
            でPLに送信してもらいましょう。
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-5">
            <p className="text-xs font-medium text-coc-muted uppercase tracking-widest mb-4">
              満足度推移チャート
            </p>
            <FeedbackBarChart stats={stats.filter((s) => s.count > 0)} />
          </div>

          <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-5">
            <p className="text-xs font-medium text-coc-muted uppercase tracking-widest mb-4">
              シナリオ別平均スコア
            </p>
            <div className="flex flex-col gap-3">
              {stats.map((s) => (
                <div
                  key={s.scenarioId}
                  className="rounded-lg border border-coc-border px-4 py-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Link
                      href={`/scenarios/${s.scenarioId}`}
                      className="text-sm font-medium text-coc-text hover:text-coc-gold transition-colors"
                    >
                      {s.title}
                    </Link>
                    <span className="text-xs text-coc-muted">
                      {s.count > 0 ? `${s.count}件` : "データなし"}
                    </span>
                  </div>
                  {s.count > 0 && (
                    <div className="grid grid-cols-4 gap-2 text-xs text-center">
                      <div>
                        <p className="text-coc-muted mb-0.5">楽しさ</p>
                        <p className="font-bold text-coc-gold">{s.avgFun.toFixed(1)}</p>
                      </div>
                      <div>
                        <p className="text-coc-muted mb-0.5">緊張感</p>
                        <p className="font-bold text-blue-400">{s.avgTension.toFixed(1)}</p>
                      </div>
                      <div>
                        <p className="text-coc-muted mb-0.5">ファシリ</p>
                        <p className="font-bold text-green-400">{s.avgFacilitation.toFixed(1)}</p>
                      </div>
                      <div>
                        <p className="text-coc-muted mb-0.5">再挑戦</p>
                        <p className="font-bold text-coc-text">{s.wouldReplayPct}%</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
