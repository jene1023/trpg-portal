export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase, isSupabaseConfigured, DiceRoll, SuccessLevel } from "@/lib/supabase";

type Props = { params: Promise<{ id: string }> };

const LEVEL_LABEL: Record<SuccessLevel, string> = {
  critical_success: "決定的成功",
  success: "通常成功",
  failure: "失敗",
  fumble: "致命的失敗",
};

type SkillStats = {
  skill_name: string;
  total: number;
  critical: number;
  success: number;
  failure: number;
  fumble: number;
  successRate: number;
  fumbleRate: number;
};

function buildSkillStats(rolls: DiceRoll[]): SkillStats[] {
  const map = new Map<string, { critical: number; success: number; failure: number; fumble: number }>();

  for (const roll of rolls) {
    const prev = map.get(roll.skill_name) ?? { critical: 0, success: 0, failure: 0, fumble: 0 };
    if (roll.success_level === "critical_success") prev.critical++;
    else if (roll.success_level === "success") prev.success++;
    else if (roll.success_level === "failure") prev.failure++;
    else if (roll.success_level === "fumble") prev.fumble++;
    map.set(roll.skill_name, prev);
  }

  const stats: SkillStats[] = [];
  for (const [skill_name, counts] of map.entries()) {
    const total = counts.critical + counts.success + counts.failure + counts.fumble;
    stats.push({
      skill_name,
      total,
      critical: counts.critical,
      success: counts.success,
      failure: counts.failure,
      fumble: counts.fumble,
      successRate: total > 0 ? Math.round(((counts.critical + counts.success) / total) * 100) : 0,
      fumbleRate: total > 0 ? Math.round((counts.fumble / total) * 100) : 0,
    });
  }

  return stats.sort((a, b) => b.total - a.total);
}

export default async function DiceStatsPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: char } = await supabase
    .from("characters")
    .select("id, name")
    .eq("id", id)
    .single();

  if (!char) notFound();

  const { data: rolls } = await supabase
    .from("dice_rolls")
    .select("*")
    .eq("character_id", id)
    .order("rolled_at", { ascending: false });

  const allRolls: DiceRoll[] = rolls ?? [];
  const skillStats = buildSkillStats(allRolls);

  const totalRolls = allRolls.length;
  const totalSuccess = allRolls.filter(
    (r) => r.success_level === "critical_success" || r.success_level === "success"
  ).length;
  const totalCritical = allRolls.filter((r) => r.success_level === "critical_success").length;
  const totalFumble = allRolls.filter((r) => r.success_level === "fumble").length;
  const overallSuccessRate = totalRolls > 0 ? Math.round((totalSuccess / totalRolls) * 100) : 0;
  const mostUsedSkill = skillStats[0]?.skill_name ?? "—";

  const levelCounts: Record<SuccessLevel, number> = {
    critical_success: totalCritical,
    success: totalSuccess - totalCritical,
    failure: allRolls.filter((r) => r.success_level === "failure").length,
    fumble: totalFumble,
  };

  const levelColors: Record<SuccessLevel, string> = {
    critical_success: "bg-yellow-400",
    success: "bg-green-500",
    failure: "bg-coc-muted/40",
    fumble: "bg-red-600",
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/characters/${id}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          {char.name}
        </Link>
      </div>

      <h1 className="font-cinzel text-xl font-bold text-coc-text mb-1">判定統計ダッシュボード</h1>
      <p className="text-xs text-coc-muted mb-8">全期間の{totalRolls}件のロールを集計</p>

      {totalRolls === 0 ? (
        <div className="rounded-lg border border-coc-border bg-coc-surface p-8 text-center text-coc-muted text-sm">
          ダイスロールの記録がまだありません。
          <br />
          <span className="block mt-1">キャラクター詳細ページの技能セクションから判定してください。</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* サマリーカード */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg border border-coc-border bg-coc-surface p-4 text-center">
              <p className="text-xs text-coc-muted mb-1">総判定数</p>
              <p className="font-cinzel text-2xl font-bold text-coc-text">{totalRolls}</p>
            </div>
            <div className="rounded-lg border border-green-800/40 bg-green-950/10 p-4 text-center">
              <p className="text-xs text-coc-muted mb-1">成功率</p>
              <p className="font-cinzel text-2xl font-bold text-green-400">{overallSuccessRate}%</p>
            </div>
            <div className="rounded-lg border border-yellow-700/40 bg-yellow-950/10 p-4 text-center">
              <p className="text-xs text-coc-muted mb-1">決定的成功</p>
              <p className="font-cinzel text-2xl font-bold text-yellow-400">{totalCritical}</p>
            </div>
            <div className="rounded-lg border border-red-800/40 bg-red-950/10 p-4 text-center">
              <p className="text-xs text-coc-muted mb-1">致命的失敗</p>
              <p className="font-cinzel text-2xl font-bold text-red-500">{totalFumble}</p>
            </div>
          </div>

          {/* 最多使用技能 */}
          <div className="rounded-lg border border-coc-border bg-coc-surface p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-coc-muted mb-0.5">最多使用技能</p>
              <p className="text-coc-text font-semibold">{mostUsedSkill}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-coc-muted mb-0.5">判定回数</p>
              <p className="font-cinzel text-lg font-bold text-coc-gold">{skillStats[0]?.total ?? 0}回</p>
            </div>
          </div>

          {/* 成功度内訳 */}
          <div className="rounded-lg border border-coc-border bg-coc-surface p-4 space-y-3">
            <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest">成功度内訳</h2>
            {(["critical_success", "success", "failure", "fumble"] as SuccessLevel[]).map((level) => {
              const count = levelCounts[level];
              const rate = totalRolls > 0 ? Math.round((count / totalRolls) * 100) : 0;
              return (
                <div key={level} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-coc-muted">{LEVEL_LABEL[level]}</span>
                    <span className="text-coc-text tabular-nums">{count}回 ({rate}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-coc-raised overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${levelColors[level]}`}
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* 技能別統計 */}
          <div className="rounded-lg border border-coc-border bg-coc-surface p-4 space-y-4">
            <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest">技能別成功率</h2>
            <div className="space-y-4">
              {skillStats.map((s) => (
                <div key={s.skill_name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-coc-text font-medium truncate max-w-[50%]">{s.skill_name}</span>
                    <span className="text-coc-muted tabular-nums text-xs shrink-0">
                      {s.total}回 ／ 成功{s.successRate}%
                      {s.fumble > 0 && (
                        <span className="text-red-400 ml-1">/ ファンブル{s.fumbleRate}%</span>
                      )}
                    </span>
                  </div>
                  {/* スタック型バー: 決定的成功・成功・失敗・ファンブル */}
                  <div className="h-2.5 rounded-full bg-coc-raised overflow-hidden flex">
                    {s.critical > 0 && (
                      <div
                        className="h-full bg-yellow-400"
                        style={{ width: `${Math.round((s.critical / s.total) * 100)}%` }}
                        title={`決定的成功: ${s.critical}回`}
                      />
                    )}
                    {s.success > 0 && (
                      <div
                        className="h-full bg-green-500"
                        style={{ width: `${Math.round((s.success / s.total) * 100)}%` }}
                        title={`通常成功: ${s.success}回`}
                      />
                    )}
                    {s.failure > 0 && (
                      <div
                        className="h-full bg-coc-muted/30"
                        style={{ width: `${Math.round((s.failure / s.total) * 100)}%` }}
                        title={`失敗: ${s.failure}回`}
                      />
                    )}
                    {s.fumble > 0 && (
                      <div
                        className="h-full bg-red-600"
                        style={{ width: `${Math.round((s.fumble / s.total) * 100)}%` }}
                        title={`致命的失敗: ${s.fumble}回`}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
            {/* 凡例 */}
            <div className="flex flex-wrap gap-3 pt-1 text-xs text-coc-muted">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-yellow-400 inline-block" />決定的成功</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-500 inline-block" />通常成功</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-coc-muted/30 inline-block" />失敗</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-600 inline-block" />致命的失敗</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
