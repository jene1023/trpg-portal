export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft, BookOpen, Users, TrendingDown, Skull } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export default async function ScenarioStatsPage() {
  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/scenarios"
            className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
          >
            <ArrowLeft size={16} />
            シナリオ一覧
          </Link>
        </div>
        <h1 className="font-cinzel text-xl font-bold text-coc-text mb-4">KP実績レポート</h1>
        <div className="rounded-lg border border-coc-border bg-coc-surface p-8 text-center text-coc-muted text-sm">
          Supabaseが設定されていません。
        </div>
      </div>
    );
  }

  const [
    { data: scenarios },
    { data: participants },
    { data: sessions },
    { data: deadRetiredChars },
  ] = await Promise.all([
    supabase.from("scenarios").select("id, status, played_at"),
    supabase.from("scenario_participants").select("id, scenario_id"),
    supabase.from("sessions").select("san_loss, hp_loss"),
    supabase
      .from("characters")
      .select("id, status")
      .in("status", ["dead", "retired"]),
  ]);

  const scenarioList = scenarios ?? [];
  const participantList = participants ?? [];
  const sessionList = sessions ?? [];
  const deadRetiredList = deadRetiredChars ?? [];

  const totalScenarios = scenarioList.length;
  const planningCount = scenarioList.filter((s) => s.status === "planning").length;
  const ongoingCount = scenarioList.filter((s) => s.status === "ongoing").length;
  const completedCount = scenarioList.filter((s) => s.status === "completed").length;

  const totalParticipants = participantList.length;

  const totalSanLoss = sessionList.reduce((sum, s) => sum + (s.san_loss ?? 0), 0);
  const totalHpLoss = sessionList.reduce((sum, s) => sum + (s.hp_loss ?? 0), 0);
  const totalSessions = sessionList.length;

  const deadCount = deadRetiredList.filter((c) => c.status === "dead").length;
  const retiredCount = deadRetiredList.filter((c) => c.status === "retired").length;

  const avgSanPerSession = totalSessions > 0 ? (totalSanLoss / totalSessions).toFixed(1) : "0.0";

  // 月別シナリオ完了数（直近6ヶ月）
  const now = new Date();
  const monthlyData: { label: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const label = `${month}月`;
    const count = scenarioList.filter((s) => {
      if (!s.played_at) return false;
      const pd = new Date(s.played_at);
      return pd.getFullYear() === year && pd.getMonth() + 1 === month;
    }).length;
    monthlyData.push({ label, count });
  }
  const maxMonthlyCount = Math.max(...monthlyData.map((m) => m.count), 1);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/scenarios"
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          シナリオ一覧
        </Link>
      </div>

      <h1 className="font-cinzel text-xl font-bold text-coc-text mb-1">KP実績レポート</h1>
      <p className="text-xs text-coc-muted mb-8">全シナリオを横断したKP活動の集計サマリー</p>

      {/* メインメトリクスカード */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="rounded-lg border border-coc-border bg-coc-surface p-4 text-center">
          <BookOpen size={18} className="mx-auto mb-1 text-coc-gold" />
          <p className="text-xs text-coc-muted mb-1">総シナリオ数</p>
          <p className="font-cinzel text-2xl font-bold text-coc-text">{totalScenarios}</p>
        </div>
        <div className="rounded-lg border border-coc-border bg-coc-surface p-4 text-center">
          <Users size={18} className="mx-auto mb-1 text-blue-400" />
          <p className="text-xs text-coc-muted mb-1">参加者のべ数</p>
          <p className="font-cinzel text-2xl font-bold text-coc-text">{totalParticipants}</p>
        </div>
        <div className="rounded-lg border border-red-800/40 bg-red-950/10 p-4 text-center">
          <TrendingDown size={18} className="mx-auto mb-1 text-red-400" />
          <p className="text-xs text-coc-muted mb-1">平均SAN損失/回</p>
          <p className="font-cinzel text-2xl font-bold text-red-400">{avgSanPerSession}</p>
        </div>
        <div className="rounded-lg border border-coc-border bg-coc-surface p-4 text-center">
          <Skull size={18} className="mx-auto mb-1 text-coc-muted" />
          <p className="text-xs text-coc-muted mb-1">死亡/引退</p>
          <p className="font-cinzel text-2xl font-bold text-coc-text">{deadCount + retiredCount}</p>
        </div>
      </div>

      {/* シナリオ進行状況内訳 */}
      <div className="rounded-lg border border-coc-border bg-coc-surface p-5 mb-6 space-y-3">
        <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest mb-3">
          シナリオ進行状況
        </h2>
        {[
          { label: "完了", count: completedCount, color: "bg-green-500", textColor: "text-green-400" },
          { label: "進行中", count: ongoingCount, color: "bg-coc-gold", textColor: "text-coc-gold" },
          { label: "準備中", count: planningCount, color: "bg-coc-muted/40", textColor: "text-coc-muted" },
        ].map(({ label, count, color, textColor }) => {
          const rate = totalScenarios > 0 ? Math.round((count / totalScenarios) * 100) : 0;
          return (
            <div key={label} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className={textColor}>{label}</span>
                <span className="text-coc-text tabular-nums">
                  {count}件 ({rate}%)
                </span>
              </div>
              <div className="h-2 rounded-full bg-coc-raised overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${color}`}
                  style={{ width: `${rate}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* 損失サマリー */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="rounded-lg border border-coc-border bg-coc-surface p-4 space-y-1">
          <p className="text-xs text-coc-muted">累計SAN損失</p>
          <p className="font-cinzel text-3xl font-bold text-red-400">{totalSanLoss}</p>
          <p className="text-xs text-coc-muted">{totalSessions}セッション合計</p>
        </div>
        <div className="rounded-lg border border-coc-border bg-coc-surface p-4 space-y-1">
          <p className="text-xs text-coc-muted">累計HP損失</p>
          <p className="font-cinzel text-3xl font-bold text-orange-400">{totalHpLoss}</p>
          <p className="text-xs text-coc-muted">{totalSessions}セッション合計</p>
        </div>
      </div>

      {/* キャラクター末路 */}
      <div className="rounded-lg border border-coc-border bg-coc-surface p-5 mb-6 space-y-3">
        <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest mb-3">
          キャラクター末路
        </h2>
        {[
          { label: "死亡", count: deadCount, color: "bg-red-600", textColor: "text-red-400" },
          { label: "引退", count: retiredCount, color: "bg-coc-muted/40", textColor: "text-coc-muted" },
        ].map(({ label, count, color, textColor }) => {
          const total = deadCount + retiredCount;
          const rate = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={label} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className={textColor}>{label}</span>
                <span className="text-coc-text tabular-nums">{count}名</span>
              </div>
              <div className="h-2 rounded-full bg-coc-raised overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${color}`}
                  style={{ width: `${rate}%` }}
                />
              </div>
            </div>
          );
        })}
        {deadCount + retiredCount === 0 && (
          <p className="text-xs text-coc-muted text-center py-2">死亡・引退キャラクターなし</p>
        )}
      </div>

      {/* 月別シナリオ実施数 */}
      <div className="rounded-lg border border-coc-border bg-coc-surface p-5">
        <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest mb-4">
          月別シナリオ実施数（直近6ヶ月）
        </h2>
        <div className="flex items-end justify-around gap-2 h-32">
          {monthlyData.map(({ label, count }) => {
            const heightPct = maxMonthlyCount > 0 ? Math.round((count / maxMonthlyCount) * 100) : 0;
            return (
              <div key={label} className="flex flex-col items-center gap-1 flex-1">
                <span className="text-xs text-coc-text font-medium tabular-nums">{count > 0 ? count : ""}</span>
                <div className="w-full flex items-end justify-center" style={{ height: "80px" }}>
                  <div
                    className="w-full max-w-8 rounded-t bg-coc-gold/70 transition-all"
                    style={{ height: count > 0 ? `${heightPct}%` : "4px", minHeight: "4px", opacity: count > 0 ? 1 : 0.2 }}
                  />
                </div>
                <span className="text-xs text-coc-muted">{label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
