export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase, isSupabaseConfigured, DiceRoll, SessionLog } from "@/lib/supabase";

type Props = { params: Promise<{ id: string }> };

type SkillRank = {
  skill_name: string;
  total: number;
  successCount: number;
  successRate: number;
};

function buildSkillRanking(rolls: DiceRoll[]): SkillRank[] {
  const map = new Map<string, { success: number; total: number }>();

  for (const roll of rolls) {
    const prev = map.get(roll.skill_name) ?? { success: 0, total: 0 };
    prev.total++;
    if (roll.success_level === "critical_success" || roll.success_level === "success") {
      prev.success++;
    }
    map.set(roll.skill_name, prev);
  }

  const ranks: SkillRank[] = [];
  for (const [skill_name, counts] of map.entries()) {
    ranks.push({
      skill_name,
      total: counts.total,
      successCount: counts.success,
      successRate: counts.total > 0 ? Math.round((counts.success / counts.total) * 100) : 0,
    });
  }

  return ranks.sort((a, b) => b.successRate - a.successRate || b.total - a.total);
}

export default async function CareerReportPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: char } = await supabase
    .from("characters")
    .select("id, name")
    .eq("id", id)
    .single();

  if (!char) notFound();

  const [{ data: sessionsRaw }, { data: rollsRaw }] = await Promise.all([
    supabase
      .from("session_logs")
      .select("*")
      .eq("character_id", id)
      .order("session_number", { ascending: true }),
    supabase
      .from("dice_rolls")
      .select("*")
      .eq("character_id", id)
      .order("rolled_at", { ascending: false }),
  ]);

  const sessions: SessionLog[] = sessionsRaw ?? [];
  const rolls: DiceRoll[] = rollsRaw ?? [];

  const totalSessions = sessions.length;
  const totalSanLoss = sessions.reduce((sum, s) => sum + (s.san_loss ?? 0), 0);
  const totalHpLoss = sessions.reduce((sum, s) => sum + (s.hp_loss ?? 0), 0);

  const totalRolls = rolls.length;
  const fumbleCount = rolls.filter((r) => r.success_level === "fumble").length;
  const successCount = rolls.filter(
    (r) => r.success_level === "critical_success" || r.success_level === "success"
  ).length;
  const overallSuccessRate = totalRolls > 0 ? Math.round((successCount / totalRolls) * 100) : 0;

  const skillRanking = buildSkillRanking(rolls);
  const topSkills = skillRanking.filter((s) => s.total >= 2).slice(0, 3);
  const mostUsedSkill = rolls.length > 0
    ? (() => {
        const countMap = new Map<string, number>();
        for (const r of rolls) countMap.set(r.skill_name, (countMap.get(r.skill_name) ?? 0) + 1);
        let best = { name: "—", count: 0 };
        for (const [name, count] of countMap.entries()) {
          if (count > best.count) best = { name, count };
        }
        return best;
      })()
    : { name: "—", count: 0 };

  const isEmpty = totalSessions === 0 && totalRolls === 0;

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

      <h1 className="font-cinzel text-xl font-bold text-coc-text mb-1">活躍統計レポート</h1>
      <p className="text-xs text-coc-muted mb-8">
        全{totalSessions}セッション・{totalRolls}回の判定による通算成績
      </p>

      {isEmpty ? (
        <div className="rounded-lg border border-coc-border bg-coc-surface p-8 text-center text-coc-muted text-sm">
          セッションログまたはダイスロールの記録がまだありません。
          <br />
          <span className="block mt-1">セッション終了処理や技能判定を行うと統計が表示されます。</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* セッション通算サマリー */}
          <section className="rounded-lg border border-coc-border bg-coc-surface p-4 space-y-3">
            <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest">セッション通算</h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-md bg-coc-raised border border-coc-border p-3 text-center">
                <p className="text-xs text-coc-muted mb-1">総セッション数</p>
                <p className="font-cinzel text-2xl font-bold text-coc-text">{totalSessions}</p>
              </div>
              <div className="rounded-md bg-red-950/15 border border-red-800/30 p-3 text-center">
                <p className="text-xs text-coc-muted mb-1">累計SAN喪失</p>
                <p className="font-cinzel text-2xl font-bold text-red-400">{totalSanLoss}</p>
              </div>
              <div className="rounded-md bg-orange-950/15 border border-orange-800/30 p-3 text-center">
                <p className="text-xs text-coc-muted mb-1">累計HP喪失</p>
                <p className="font-cinzel text-2xl font-bold text-orange-400">{totalHpLoss}</p>
              </div>
            </div>
          </section>

          {/* 判定通算サマリー */}
          {totalRolls > 0 && (
            <section className="rounded-lg border border-coc-border bg-coc-surface p-4 space-y-3">
              <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest">判定通算</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-md bg-coc-raised border border-coc-border p-3 text-center">
                  <p className="text-xs text-coc-muted mb-1">総判定数</p>
                  <p className="font-cinzel text-2xl font-bold text-coc-text">{totalRolls}</p>
                </div>
                <div className="rounded-md bg-green-950/15 border border-green-800/30 p-3 text-center">
                  <p className="text-xs text-coc-muted mb-1">総合成功率</p>
                  <p className="font-cinzel text-2xl font-bold text-green-400">{overallSuccessRate}%</p>
                </div>
                <div className="rounded-md bg-coc-raised border border-coc-border p-3 text-center">
                  <p className="text-xs text-coc-muted mb-1">最多使用技能</p>
                  <p className="text-sm font-semibold text-coc-text truncate" title={mostUsedSkill.name}>
                    {mostUsedSkill.name}
                  </p>
                  <p className="text-xs text-coc-muted mt-0.5">{mostUsedSkill.count}回</p>
                </div>
                <div className="rounded-md bg-red-950/15 border border-red-800/30 p-3 text-center">
                  <p className="text-xs text-coc-muted mb-1">ファンブル回数</p>
                  <p className="font-cinzel text-2xl font-bold text-red-500">{fumbleCount}</p>
                </div>
              </div>
            </section>
          )}

          {/* 成功率トップ3技能 */}
          {topSkills.length > 0 && (
            <section className="rounded-lg border border-coc-border bg-coc-surface p-4 space-y-4">
              <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest">成功率トップ3技能</h2>
              <p className="text-xs text-coc-muted -mt-2">※ 2回以上判定した技能のみ対象</p>
              <div className="space-y-3">
                {topSkills.map((s, i) => (
                  <div key={s.skill_name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
                            i === 0
                              ? "bg-yellow-500/20 text-yellow-400 border border-yellow-600/40"
                              : i === 1
                              ? "bg-zinc-500/20 text-zinc-300 border border-zinc-600/40"
                              : "bg-amber-700/20 text-amber-600 border border-amber-700/40"
                          }`}
                        >
                          {i + 1}
                        </span>
                        <span className="text-coc-text font-medium truncate">{s.skill_name}</span>
                      </div>
                      <span className="text-coc-muted tabular-nums text-xs shrink-0 ml-2">
                        {s.successCount}/{s.total}回 — {s.successRate}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-coc-raised overflow-hidden">
                      <div
                        className="h-full rounded-full bg-green-500 transition-all"
                        style={{ width: `${s.successRate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* セッションログ一覧 */}
          {sessions.length > 0 && (
            <section className="rounded-lg border border-coc-border bg-coc-surface p-4 space-y-3">
              <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest">セッション別内訳</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-coc-muted border-b border-coc-border">
                      <th className="text-left py-1.5 pr-3 font-medium whitespace-nowrap">#</th>
                      <th className="text-left py-1.5 pr-3 font-medium">タイトル</th>
                      <th className="text-right py-1.5 pr-3 font-medium whitespace-nowrap">SAN喪失</th>
                      <th className="text-right py-1.5 font-medium whitespace-nowrap">HP喪失</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-coc-border/40">
                    {sessions.map((s) => (
                      <tr key={s.id} className="text-coc-muted hover:text-coc-text transition-colors">
                        <td className="py-2 pr-3 text-coc-gold font-cinzel tabular-nums">{s.session_number}</td>
                        <td className="py-2 pr-3 text-coc-text max-w-[180px] truncate">{s.title}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">
                          {s.san_loss > 0 ? (
                            <span className="text-red-400">−{s.san_loss}</span>
                          ) : (
                            <span className="text-coc-muted/50">0</span>
                          )}
                        </td>
                        <td className="py-2 text-right tabular-nums">
                          {s.hp_loss > 0 ? (
                            <span className="text-orange-400">−{s.hp_loss}</span>
                          ) : (
                            <span className="text-coc-muted/50">0</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
