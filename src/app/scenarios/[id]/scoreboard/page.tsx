export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trophy, Skull, Star, Dices, TrendingUp } from "lucide-react";
import { supabase, isSupabaseConfigured, DiceRoll } from "@/lib/supabase";

type Props = { params: Promise<{ id: string }> };

type CharacterStats = {
  characterId: string;
  characterName: string;
  total: number;
  criticalCount: number;
  successCount: number;
  fumbleCount: number;
  successRate: number;
};

function buildStats(
  characterId: string,
  characterName: string,
  rolls: DiceRoll[]
): CharacterStats {
  const total = rolls.length;
  const criticalCount = rolls.filter((r) => r.success_level === "critical_success").length;
  const successCount = rolls.filter((r) => r.success_level === "success").length;
  const fumbleCount = rolls.filter((r) => r.success_level === "fumble").length;
  const successRate = total > 0 ? Math.round(((criticalCount + successCount) / total) * 100) : 0;
  return { characterId, characterName, total, criticalCount, successCount, fumbleCount, successRate };
}

const MEDAL: Record<number, string> = { 0: "🥇", 1: "🥈", 2: "🥉" };

function RankingSection({
  title,
  icon,
  items,
  unit,
  highlightColor,
}: {
  title: string;
  icon: unknown;
  items: { name: string; value: number }[];
  unit: string;
  highlightColor: string;
}) {
  if (items.length === 0) return null;
  const maxValue = Math.max(...items.map((i) => i.value));
  return (
    <div className="rounded-xl border border-coc-border bg-coc-surface p-4">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h2 className="font-cinzel text-sm font-semibold text-coc-text">{title}</h2>
      </div>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={item.name + idx} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-coc-text">
                {MEDAL[idx] ?? ""} {item.name}
              </span>
              <span className={`font-bold tabular-nums ${highlightColor}`}>
                {item.value}
                {unit}
              </span>
            </div>
            {maxValue > 0 && (
              <div className="h-1.5 rounded-full bg-coc-raised overflow-hidden">
                <div
                  className={`h-full rounded-full ${highlightColor.replace("text-", "bg-")}`}
                  style={{ width: `${Math.round((item.value / maxValue) * 100)}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function ScenarioScoreboardPage({ params }: Props) {
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
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6">
          <Link
            href={`/scenarios/${id}`}
            className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
          >
            <ArrowLeft size={16} />
            {scenario.title}
          </Link>
        </div>
        <h1 className="font-cinzel text-xl font-bold text-coc-text mb-1">ダイスロールスコアボード</h1>
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
  for (const cid of characterIds) {
    rollsByCharacter.set(cid, []);
  }
  for (const roll of rollRows ?? []) {
    const arr = rollsByCharacter.get(roll.character_id);
    if (arr) arr.push(roll as DiceRoll);
  }

  const statsList: CharacterStats[] = characterIds.map((cid) =>
    buildStats(cid, characterMap.get(cid) ?? "不明", rollsByCharacter.get(cid) ?? [])
  );

  const grandTotal = (rollRows ?? []).length;

  const byFumble = [...statsList]
    .filter((s) => s.total > 0)
    .sort((a, b) => b.fumbleCount - a.fumbleCount)
    .slice(0, 3)
    .map((s) => ({ name: s.characterName, value: s.fumbleCount }));

  const byCritical = [...statsList]
    .filter((s) => s.total > 0)
    .sort((a, b) => b.criticalCount - a.criticalCount)
    .slice(0, 3)
    .map((s) => ({ name: s.characterName, value: s.criticalCount }));

  const bySuccessRate = [...statsList]
    .filter((s) => s.total > 0)
    .sort((a, b) => b.successRate - a.successRate)
    .slice(0, 3)
    .map((s) => ({ name: s.characterName, value: s.successRate }));

  const byTotal = [...statsList]
    .sort((a, b) => b.total - a.total)
    .slice(0, 3)
    .map((s) => ({ name: s.characterName, value: s.total }));

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <Link
          href={`/scenarios/${id}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          {scenario.title}
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-1">
        <Trophy size={22} className="text-coc-gold" />
        <h1 className="font-cinzel text-xl font-bold text-coc-text">ダイスロールスコアボード</h1>
      </div>
      <p className="text-xs text-coc-muted mb-8">
        {scenario.title} — 参加者{characterIds.length}名・合計{grandTotal}件のロール
      </p>

      {grandTotal === 0 ? (
        <div className="rounded-lg border border-coc-border bg-coc-surface p-8 text-center text-coc-muted text-sm">
          このシナリオの参加者のダイスロール記録がまだありません。
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <RankingSection
            title="最多クリティカル成功"
            icon={<Star size={16} className="text-yellow-400" />}
            items={byCritical}
            unit="回"
            highlightColor="text-yellow-400"
          />
          <RankingSection
            title="最多ファンブル"
            icon={<Skull size={16} className="text-red-400" />}
            items={byFumble}
            unit="回"
            highlightColor="text-red-400"
          />
          <RankingSection
            title="最高成功率"
            icon={<TrendingUp size={16} className="text-green-400" />}
            items={bySuccessRate}
            unit="%"
            highlightColor="text-green-400"
          />
          <RankingSection
            title="総判定数"
            icon={<Dices size={16} className="text-coc-gold" />}
            items={byTotal}
            unit="回"
            highlightColor="text-coc-gold"
          />
        </div>
      )}

      {grandTotal > 0 && (
        <div className="mt-6 rounded-xl border border-coc-border bg-coc-surface p-4">
          <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest mb-3">全参加者サマリー</h2>
          <div className="space-y-3">
            {statsList
              .sort((a, b) => b.total - a.total)
              .map((s) => (
                <div key={s.characterId} className="flex items-center justify-between text-sm">
                  <Link
                    href={`/characters/${s.characterId}/dice-stats`}
                    className="text-coc-text hover:text-coc-gold transition-colors truncate mr-2"
                  >
                    {s.characterName}
                  </Link>
                  <div className="flex items-center gap-3 text-xs text-coc-muted whitespace-nowrap">
                    <span className="text-yellow-400" title="決定的成功">★{s.criticalCount}</span>
                    <span className="text-green-400" title="成功率">{s.successRate}%</span>
                    <span className="text-red-400" title="ファンブル">💀{s.fumbleCount}</span>
                    <span className="text-coc-muted" title="総判定数">{s.total}回</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
