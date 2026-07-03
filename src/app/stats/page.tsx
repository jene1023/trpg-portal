export const dynamic = "force-dynamic";

import Link from "next/link";
import { BarChart2 } from "lucide-react";
import {
  supabase,
  isSupabaseConfigured,
  Character,
  SessionLog,
  DiceRoll,
  SuccessLevel,
} from "@/lib/supabase";

type CharacterWithData = Character & {
  sessions: SessionLog[];
  dice_rolls: DiceRoll[];
};

const STATUS_LABELS: Record<string, string> = {
  alive: "生存",
  dead: "死亡",
  insane: "発狂",
  retired: "退場",
};

const STATUS_COLORS: Record<string, string> = {
  alive: "text-green-400",
  dead: "text-red-500",
  insane: "text-purple-400",
  retired: "text-coc-muted",
};

const LEVEL_LABEL: Record<SuccessLevel, string> = {
  critical_success: "決定的成功",
  success: "通常成功",
  failure: "失敗",
  fumble: "致命的失敗",
};

const LEVEL_COLORS: Record<SuccessLevel, string> = {
  critical_success: "bg-yellow-400",
  success: "bg-green-500",
  failure: "bg-coc-muted/30",
  fumble: "bg-red-600",
};

type SkillSummary = {
  skill_name: string;
  total: number;
  success: number;
  successRate: number;
};

function topSkills(rolls: DiceRoll[], topN = 5): SkillSummary[] {
  const map = new Map<string, { total: number; success: number }>();
  for (const r of rolls) {
    const prev = map.get(r.skill_name) ?? { total: 0, success: 0 };
    prev.total++;
    if (r.success_level === "critical_success" || r.success_level === "success") {
      prev.success++;
    }
    map.set(r.skill_name, prev);
  }
  return Array.from(map.entries())
    .map(([skill_name, v]) => ({
      skill_name,
      total: v.total,
      success: v.success,
      successRate: v.total > 0 ? Math.round((v.success / v.total) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, topN);
}

export default async function StatsPage() {
  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-coc-muted">
        Supabase が設定されていません。
      </div>
    );
  }

  const { data: characters } = await supabase
    .from("characters")
    .select("*, sessions(*), dice_rolls(*)")
    .order("created_at", { ascending: false });

  const chars: CharacterWithData[] = (characters ?? []) as CharacterWithData[];

  const totalChars = chars.length;
  const statusCounts: Record<string, number> = { alive: 0, dead: 0, insane: 0, retired: 0 };
  for (const c of chars) {
    if (c.status in statusCounts) statusCounts[c.status]++;
  }

  const allSessions: SessionLog[] = chars.flatMap((c) => c.sessions ?? []);
  const totalSessions = allSessions.length;
  const totalSanLoss = allSessions.reduce((acc, s) => acc + (s.san_loss ?? 0), 0);
  const totalHpLoss = allSessions.reduce((acc, s) => acc + (s.hp_loss ?? 0), 0);

  const allRolls: DiceRoll[] = chars.flatMap((c) => c.dice_rolls ?? []);
  const totalRolls = allRolls.length;
  const totalSuccessRolls = allRolls.filter(
    (r) => r.success_level === "critical_success" || r.success_level === "success"
  ).length;
  const overallSuccessRate = totalRolls > 0 ? Math.round((totalSuccessRolls / totalRolls) * 100) : 0;

  const levelCounts: Record<SuccessLevel, number> = {
    critical_success: allRolls.filter((r) => r.success_level === "critical_success").length,
    success: allRolls.filter((r) => r.success_level === "success").length,
    failure: allRolls.filter((r) => r.success_level === "failure").length,
    fumble: allRolls.filter((r) => r.success_level === "fumble").length,
  };

  const skills = topSkills(allRolls, 5);
  const maxSkillTotal = skills[0]?.total ?? 1;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <BarChart2 size={22} className="text-coc-gold" />
        <h1 className="font-cinzel text-xl font-bold text-coc-text">PLレベル統計</h1>
      </div>
      <p className="text-xs text-coc-muted mb-8">
        全{totalChars}キャラクターのデータを集計しています。
      </p>

      {totalChars === 0 ? (
        <div className="rounded-lg border border-coc-border bg-coc-surface p-8 text-center text-coc-muted text-sm">
          キャラクターがまだ登録されていません。
          <br />
          <Link href="/characters/new" className="mt-2 inline-block text-coc-gold hover:underline">
            キャラクターを作成する
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* キャラクターサマリー */}
          <section className="rounded-lg border border-coc-border bg-coc-surface p-5 space-y-4">
            <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest">キャラクター概要</h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="rounded-md border border-coc-border bg-coc-bg p-3 text-center">
                <p className="text-xs text-coc-muted mb-1">総数</p>
                <p className="font-cinzel text-2xl font-bold text-coc-text">{totalChars}</p>
              </div>
              {(["alive", "dead", "insane", "retired"] as const).map((st) => (
                <div key={st} className="rounded-md border border-coc-border bg-coc-bg p-3 text-center">
                  <p className="text-xs text-coc-muted mb-1">{STATUS_LABELS[st]}</p>
                  <p className={`font-cinzel text-2xl font-bold ${STATUS_COLORS[st]}`}>
                    {statusCounts[st]}
                  </p>
                </div>
              ))}
            </div>
            {/* ステータス割合バー */}
            {totalChars > 0 && (
              <div className="h-3 rounded-full overflow-hidden flex gap-0.5">
                {(["alive", "dead", "insane", "retired"] as const).map((st) => {
                  const pct = Math.round((statusCounts[st] / totalChars) * 100);
                  if (pct === 0) return null;
                  const barColor: Record<string, string> = {
                    alive: "bg-green-500",
                    dead: "bg-red-600",
                    insane: "bg-purple-500",
                    retired: "bg-coc-muted/40",
                  };
                  return (
                    <div
                      key={st}
                      className={`h-full ${barColor[st]}`}
                      style={{ width: `${pct}%` }}
                      title={`${STATUS_LABELS[st]}: ${statusCounts[st]}人`}
                    />
                  );
                })}
              </div>
            )}
            <div className="flex flex-wrap gap-3 text-xs text-coc-muted">
              {(["alive", "dead", "insane", "retired"] as const).map((st) => (
                <span key={st} className="flex items-center gap-1.5">
                  <span
                    className={`w-2.5 h-2.5 rounded-sm inline-block ${
                      { alive: "bg-green-500", dead: "bg-red-600", insane: "bg-purple-500", retired: "bg-coc-muted/40" }[st]
                    }`}
                  />
                  {STATUS_LABELS[st]}
                </span>
              ))}
            </div>
          </section>

          {/* セッション統計 */}
          <section className="rounded-lg border border-coc-border bg-coc-surface p-5 space-y-4">
            <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest">セッション統計</h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-md border border-coc-border bg-coc-bg p-3 text-center">
                <p className="text-xs text-coc-muted mb-1">総セッション数</p>
                <p className="font-cinzel text-2xl font-bold text-coc-text">{totalSessions}</p>
              </div>
              <div className="rounded-md border border-red-800/40 bg-red-950/10 p-3 text-center">
                <p className="text-xs text-coc-muted mb-1">累計SAN喪失</p>
                <p className="font-cinzel text-2xl font-bold text-red-400">{totalSanLoss}</p>
              </div>
              <div className="rounded-md border border-orange-800/40 bg-orange-950/10 p-3 text-center">
                <p className="text-xs text-coc-muted mb-1">累計HP喪失</p>
                <p className="font-cinzel text-2xl font-bold text-orange-400">{totalHpLoss}</p>
              </div>
            </div>
          </section>

          {/* ダイスロール統計 */}
          <section className="rounded-lg border border-coc-border bg-coc-surface p-5 space-y-4">
            <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest">ダイスロール統計</h2>
            {totalRolls === 0 ? (
              <p className="text-sm text-coc-muted">ダイスロールの記録がまだありません。</p>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-md border border-coc-border bg-coc-bg p-3 text-center">
                    <p className="text-xs text-coc-muted mb-1">総判定数</p>
                    <p className="font-cinzel text-2xl font-bold text-coc-text">{totalRolls}</p>
                  </div>
                  <div className="rounded-md border border-green-800/40 bg-green-950/10 p-3 text-center">
                    <p className="text-xs text-coc-muted mb-1">通算成功率</p>
                    <p className="font-cinzel text-2xl font-bold text-green-400">{overallSuccessRate}%</p>
                  </div>
                  <div className="rounded-md border border-yellow-700/40 bg-yellow-950/10 p-3 text-center">
                    <p className="text-xs text-coc-muted mb-1">決定的成功</p>
                    <p className="font-cinzel text-2xl font-bold text-yellow-400">{levelCounts.critical_success}</p>
                  </div>
                  <div className="rounded-md border border-red-800/40 bg-red-950/10 p-3 text-center">
                    <p className="text-xs text-coc-muted mb-1">致命的失敗</p>
                    <p className="font-cinzel text-2xl font-bold text-red-500">{levelCounts.fumble}</p>
                  </div>
                </div>

                {/* 成功度内訳バー */}
                <div className="space-y-2.5">
                  {(["critical_success", "success", "failure", "fumble"] as SuccessLevel[]).map((level) => {
                    const count = levelCounts[level];
                    const rate = Math.round((count / totalRolls) * 100);
                    return (
                      <div key={level} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-coc-muted">{LEVEL_LABEL[level]}</span>
                          <span className="text-coc-text tabular-nums">{count}回 ({rate}%)</span>
                        </div>
                        <div className="h-2 rounded-full bg-coc-raised overflow-hidden">
                          <div
                            className={`h-full rounded-full ${LEVEL_COLORS[level]}`}
                            style={{ width: `${rate}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </section>

          {/* 最多使用技能TOP5 */}
          {skills.length > 0 && (
            <section className="rounded-lg border border-coc-border bg-coc-surface p-5 space-y-4">
              <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest">最多使用技能 TOP5</h2>
              <div className="space-y-3">
                {skills.map((s, i) => (
                  <div key={s.skill_name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="font-cinzel text-coc-gold text-xs w-5 tabular-nums">#{i + 1}</span>
                        <span className="text-coc-text font-medium truncate max-w-[180px]">{s.skill_name}</span>
                      </span>
                      <span className="text-xs text-coc-muted tabular-nums shrink-0">
                        {s.total}回 / 成功{s.successRate}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-coc-raised overflow-hidden">
                      <div
                        className="h-full rounded-full bg-coc-gold/70"
                        style={{ width: `${Math.round((s.total / maxSkillTotal) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* キャラクター一覧リンク */}
          <div className="rounded-lg border border-coc-border bg-coc-surface p-4">
            <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest mb-3">キャラクター</h2>
            <ul className="space-y-2">
              {chars.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/characters/${c.id}`}
                    className="flex items-center justify-between group"
                  >
                    <span className="text-sm text-coc-text group-hover:text-coc-gold transition-colors truncate max-w-[60%]">
                      {c.name}
                    </span>
                    <span className="flex items-center gap-3 text-xs text-coc-muted shrink-0">
                      <span>{(c.sessions ?? []).length}セッション</span>
                      <span className={STATUS_COLORS[c.status]}>{STATUS_LABELS[c.status]}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
