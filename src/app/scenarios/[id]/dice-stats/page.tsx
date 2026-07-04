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

type ParticipantStats = {
  characterId: string;
  characterName: string;
  total: number;
  criticalCount: number;
  successCount: number;
  failureCount: number;
  fumbleCount: number;
  successRate: number;
  fumbleRate: number;
  mostUsedSkill: string;
};

function buildParticipantStats(
  characterId: string,
  characterName: string,
  rolls: DiceRoll[]
): ParticipantStats {
  const total = rolls.length;
  const criticalCount = rolls.filter((r) => r.success_level === "critical_success").length;
  const successCount = rolls.filter((r) => r.success_level === "success").length;
  const failureCount = rolls.filter((r) => r.success_level === "failure").length;
  const fumbleCount = rolls.filter((r) => r.success_level === "fumble").length;

  const skillCounts = new Map<string, number>();
  for (const roll of rolls) {
    skillCounts.set(roll.skill_name, (skillCounts.get(roll.skill_name) ?? 0) + 1);
  }
  let mostUsedSkill = "—";
  let maxCount = 0;
  for (const [skill, count] of skillCounts.entries()) {
    if (count > maxCount) {
      maxCount = count;
      mostUsedSkill = skill;
    }
  }

  return {
    characterId,
    characterName,
    total,
    criticalCount,
    successCount,
    failureCount,
    fumbleCount,
    successRate: total > 0 ? Math.round(((criticalCount + successCount) / total) * 100) : 0,
    fumbleRate: total > 0 ? Math.round((fumbleCount / total) * 100) : 0,
    mostUsedSkill,
  };
}

export default async function ScenarioDiceStatsPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: scenario } = await supabase
    .from("scenarios")
    .select("id, title")
    .eq("id", id)
    .single();

  if (!scenario) notFound();

  const { data: participantRows } = await supabase
    .from("scenario_participants")
    .select("character_id")
    .eq("scenario_id", id);

  const characterIds = (participantRows ?? []).map((p) => p.character_id);

  if (characterIds.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link
            href={`/scenarios/${id}`}
            className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
          >
            <ArrowLeft size={16} />
            {scenario.title}
          </Link>
        </div>
        <h1 className="font-cinzel text-xl font-bold text-coc-text mb-1">判定統計ダッシュボード</h1>
        <p className="text-xs text-coc-muted mb-8">{scenario.title}</p>
        <div className="rounded-lg border border-coc-border bg-coc-surface p-8 text-center text-coc-muted text-sm">
          参加キャラクターが登録されていません。
          <br />
          <span className="block mt-1">
            <Link href={`/scenarios/${id}/participants`} className="text-coc-gold underline">
              参加キャラクターを追加
            </Link>
            してください。
          </span>
        </div>
      </div>
    );
  }

  const [{ data: characterRows }, { data: rollRows }] = await Promise.all([
    supabase.from("characters").select("id, name").in("id", characterIds),
    supabase.from("dice_rolls").select("*").in("character_id", characterIds),
  ]);

  const characterMap = new Map<string, string>(
    (characterRows ?? []).map((c) => [c.id, c.name])
  );

  const rollsByCharacter = new Map<string, DiceRoll[]>();
  for (const id_ of characterIds) {
    rollsByCharacter.set(id_, []);
  }
  for (const roll of rollRows ?? []) {
    const arr = rollsByCharacter.get(roll.character_id);
    if (arr) arr.push(roll as DiceRoll);
  }

  const participantStats: ParticipantStats[] = characterIds.map((cid) =>
    buildParticipantStats(
      cid,
      characterMap.get(cid) ?? "不明",
      rollsByCharacter.get(cid) ?? []
    )
  );

  const allRolls = rollRows ?? [];
  const grandTotal = allRolls.length;
  const grandCritical = allRolls.filter((r) => r.success_level === "critical_success").length;
  const grandSuccess = allRolls.filter((r) => r.success_level === "success").length;
  const grandFailure = allRolls.filter((r) => r.success_level === "failure").length;
  const grandFumble = allRolls.filter((r) => r.success_level === "fumble").length;
  const grandSuccessRate = grandTotal > 0 ? Math.round(((grandCritical + grandSuccess) / grandTotal) * 100) : 0;

  const levelCounts: Record<SuccessLevel, number> = {
    critical_success: grandCritical,
    success: grandSuccess,
    failure: grandFailure,
    fumble: grandFumble,
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
          href={`/scenarios/${id}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          {scenario.title}
        </Link>
      </div>

      <h1 className="font-cinzel text-xl font-bold text-coc-text mb-1">判定統計ダッシュボード</h1>
      <p className="text-xs text-coc-muted mb-8">
        {scenario.title} — 参加者{characterIds.length}名・合計{grandTotal}件のロール
      </p>

      {grandTotal === 0 ? (
        <div className="rounded-lg border border-coc-border bg-coc-surface p-8 text-center text-coc-muted text-sm">
          このシナリオの参加者のダイスロール記録がまだありません。
        </div>
      ) : (
        <div className="space-y-6">
          {/* 全体サマリー */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg border border-coc-border bg-coc-surface p-4 text-center">
              <p className="text-xs text-coc-muted mb-1">総判定数</p>
              <p className="font-cinzel text-2xl font-bold text-coc-text">{grandTotal}</p>
            </div>
            <div className="rounded-lg border border-green-800/40 bg-green-950/10 p-4 text-center">
              <p className="text-xs text-coc-muted mb-1">全体成功率</p>
              <p className="font-cinzel text-2xl font-bold text-green-400">{grandSuccessRate}%</p>
            </div>
            <div className="rounded-lg border border-yellow-700/40 bg-yellow-950/10 p-4 text-center">
              <p className="text-xs text-coc-muted mb-1">決定的成功</p>
              <p className="font-cinzel text-2xl font-bold text-yellow-400">{grandCritical}</p>
            </div>
            <div className="rounded-lg border border-red-800/40 bg-red-950/10 p-4 text-center">
              <p className="text-xs text-coc-muted mb-1">致命的失敗</p>
              <p className="font-cinzel text-2xl font-bold text-red-500">{grandFumble}</p>
            </div>
          </div>

          {/* 全体成功度内訳 */}
          <div className="rounded-lg border border-coc-border bg-coc-surface p-4 space-y-3">
            <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest">全体成功度内訳</h2>
            {(["critical_success", "success", "failure", "fumble"] as SuccessLevel[]).map((level) => {
              const count = levelCounts[level];
              const rate = grandTotal > 0 ? Math.round((count / grandTotal) * 100) : 0;
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

          {/* 参加者別統計 */}
          <div className="space-y-4">
            <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest">参加者別統計</h2>
            {participantStats.map((ps) => (
              <div key={ps.characterId} className="rounded-lg border border-coc-border bg-coc-surface p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Link
                    href={`/characters/${ps.characterId}/dice-stats`}
                    className="font-medium text-coc-text hover:text-coc-gold transition-colors"
                  >
                    {ps.characterName}
                  </Link>
                  <span className="text-xs text-coc-muted tabular-nums">{ps.total}回</span>
                </div>

                {ps.total === 0 ? (
                  <p className="text-xs text-coc-muted">ロール記録なし</p>
                ) : (
                  <>
                    {/* サマリー行 */}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="rounded bg-green-950/20 border border-green-800/30 py-1.5">
                        <p className="text-coc-muted">成功率</p>
                        <p className="font-bold text-green-400">{ps.successRate}%</p>
                      </div>
                      <div className="rounded bg-red-950/20 border border-red-800/30 py-1.5">
                        <p className="text-coc-muted">ファンブル率</p>
                        <p className="font-bold text-red-400">{ps.fumbleRate}%</p>
                      </div>
                      <div className="rounded bg-coc-raised border border-coc-border py-1.5">
                        <p className="text-coc-muted">最多使用技能</p>
                        <p className="font-bold text-coc-text truncate px-1">{ps.mostUsedSkill}</p>
                      </div>
                    </div>

                    {/* 成功率バー */}
                    <div className="space-y-1">
                      <div className="h-2.5 rounded-full bg-coc-raised overflow-hidden flex">
                        {ps.criticalCount > 0 && (
                          <div
                            className="h-full bg-yellow-400"
                            style={{ width: `${Math.round((ps.criticalCount / ps.total) * 100)}%` }}
                            title={`決定的成功: ${ps.criticalCount}回`}
                          />
                        )}
                        {ps.successCount > 0 && (
                          <div
                            className="h-full bg-green-500"
                            style={{ width: `${Math.round((ps.successCount / ps.total) * 100)}%` }}
                            title={`通常成功: ${ps.successCount}回`}
                          />
                        )}
                        {ps.failureCount > 0 && (
                          <div
                            className="h-full bg-coc-muted/30"
                            style={{ width: `${Math.round((ps.failureCount / ps.total) * 100)}%` }}
                            title={`失敗: ${ps.failureCount}回`}
                          />
                        )}
                        {ps.fumbleCount > 0 && (
                          <div
                            className="h-full bg-red-600"
                            style={{ width: `${Math.round((ps.fumbleCount / ps.total) * 100)}%` }}
                            title={`致命的失敗: ${ps.fumbleCount}回`}
                          />
                        )}
                      </div>
                      <div className="flex justify-between text-xs text-coc-muted tabular-nums">
                        <span>
                          決定的{ps.criticalCount} / 成功{ps.successCount} / 失敗{ps.failureCount} / ファンブル{ps.fumbleCount}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* 凡例 */}
          <div className="flex flex-wrap gap-3 text-xs text-coc-muted">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-yellow-400 inline-block" />決定的成功</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-500 inline-block" />通常成功</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-coc-muted/30 inline-block" />失敗</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-600 inline-block" />致命的失敗</span>
          </div>
        </div>
      )}
    </div>
  );
}
