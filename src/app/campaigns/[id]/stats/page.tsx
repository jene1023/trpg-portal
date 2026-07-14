export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft, BarChart2 } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type Props = { params: Promise<{ id: string }> };

type StatCard = { label: string; value: string | number; color?: string };

function BarRow({
  label,
  value,
  max,
  color,
  suffix = "",
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  suffix?: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-32 shrink-0 text-xs text-coc-muted text-right truncate">{label}</span>
      <div className="flex-1 h-3 bg-coc-raised rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-12 text-right text-xs text-coc-text shrink-0">
        {value}{suffix}
      </span>
    </div>
  );
}

export default async function CampaignStatsPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 text-center text-coc-muted">
        Supabase が未設定です。
      </div>
    );
  }

  const [{ data: campaign }, { data: links }] = await Promise.all([
    supabase.from("campaigns").select("id, title").eq("id", id).single(),
    supabase.from("campaign_scenarios").select("scenario_id").eq("campaign_id", id),
  ]);

  if (!campaign) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 text-center text-coc-muted">
        キャンペーンが見つかりません。
      </div>
    );
  }

  const scenarioIds: string[] = (links ?? []).map((l) => l.scenario_id as string);

  const [{ data: scenarios }, { data: participantRows }, { data: deadChars }] = await Promise.all([
    scenarioIds.length > 0
      ? supabase.from("scenarios").select("id, status").in("id", scenarioIds)
      : Promise.resolve({ data: [] }),
    scenarioIds.length > 0
      ? supabase
          .from("scenario_participants")
          .select("character_id, scenario_id, characters(id, name)")
          .in("scenario_id", scenarioIds)
      : Promise.resolve({ data: [] }),
    supabase.from("characters").select("id, status").in("status", ["dead", "retired"]),
  ]);

  const charIds = [...new Set((participantRows ?? []).map((p) => p.character_id as string))];

  const [{ data: sessionRows }, { data: diceRows }] = await Promise.all([
    charIds.length > 0
      ? supabase
          .from("sessions")
          .select("id, character_id, san_loss, hp_loss")
          .in("character_id", charIds)
      : Promise.resolve({ data: [] }),
    charIds.length > 0
      ? supabase
          .from("dice_rolls")
          .select("character_id, skill_name, success_level")
          .in("character_id", charIds)
      : Promise.resolve({ data: [] }),
  ]);

  const sessionIds = (sessionRows ?? []).map((s) => s.id as string);
  const { data: npcEncounterRows } =
    sessionIds.length > 0
      ? await supabase
          .from("session_npc_encounters")
          .select("npc_id, npcs(name)")
          .in("session_id", sessionIds)
      : { data: [] };

  // ── Compute stats ──────────────────────────────────────────────────────────

  const scenarioList = scenarios ?? [];
  const totalScenarios = scenarioList.length;
  const completedScenarios = scenarioList.filter((s) => s.status === "completed").length;
  const ongoingScenarios = scenarioList.filter((s) => s.status === "ongoing").length;
  const planningScenarios = scenarioList.filter((s) => s.status === "planning").length;

  const totalSanLoss = (sessionRows ?? []).reduce(
    (sum, s) => sum + ((s.san_loss as number) ?? 0),
    0,
  );
  const totalHpLoss = (sessionRows ?? []).reduce(
    (sum, s) => sum + ((s.hp_loss as number) ?? 0),
    0,
  );

  const campaignCharIdSet = new Set(charIds);
  const deadRetiredCount = (deadChars ?? []).filter((c) => campaignCharIdSet.has(c.id)).length;
  const totalParticipants = (participantRows ?? []).length;

  // Skill success rate TOP5 (min 3 rolls)
  const skillMap = new Map<string, { total: number; success: number }>();
  for (const r of (diceRows ?? []) as { skill_name: string; success_level: string }[]) {
    const entry = skillMap.get(r.skill_name) ?? { total: 0, success: 0 };
    entry.total++;
    if (r.success_level === "critical_success" || r.success_level === "success") entry.success++;
    skillMap.set(r.skill_name, entry);
  }
  const topSkills = [...skillMap.entries()]
    .filter(([, v]) => v.total >= 3)
    .map(([name, v]) => ({
      name,
      total: v.total,
      rate: Math.round((v.success / v.total) * 100),
    }))
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 5);

  // NPC encounter frequency TOP3
  const npcCountMap = new Map<string, { name: string; count: number }>();
  for (const e of (npcEncounterRows ?? []) as unknown as {
    npc_id: string;
    npcs: { name: string } | null;
  }[]) {
    const existing = npcCountMap.get(e.npc_id);
    if (existing) {
      existing.count++;
    } else {
      npcCountMap.set(e.npc_id, { name: e.npcs?.name ?? "不明", count: 1 });
    }
  }
  const topNpcs = [...npcCountMap.values()].sort((a, b) => b.count - a.count).slice(0, 3);

  // Character participation ranking TOP5
  const charParticipationMap = new Map<string, { name: string; count: number }>();
  for (const p of (participantRows ?? []) as unknown as {
    character_id: string;
    characters: { name: string } | null;
  }[]) {
    const existing = charParticipationMap.get(p.character_id);
    if (existing) {
      existing.count++;
    } else {
      charParticipationMap.set(p.character_id, {
        name: p.characters?.name ?? "不明",
        count: 1,
      });
    }
  }
  const charRanking = [...charParticipationMap.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // ── Render ─────────────────────────────────────────────────────────────────

  const cards: StatCard[] = [
    { label: "総シナリオ数", value: totalScenarios, color: "text-coc-text" },
    { label: "完了シナリオ", value: completedScenarios, color: "text-green-400" },
    { label: "のべ参加者数", value: totalParticipants, color: "text-coc-gold" },
    { label: "累計SAN損失", value: totalSanLoss, color: "text-purple-400" },
    { label: "累計HP損失", value: totalHpLoss, color: "text-red-400" },
    { label: "死亡/引退キャラ", value: deadRetiredCount, color: "text-coc-muted" },
  ];

  const barMax = Math.max(completedScenarios, ongoingScenarios, planningScenarios, 1);
  const npcBarMax = topNpcs.length > 0 ? Math.max(...topNpcs.map((n) => n.count)) : 1;
  const charBarMax = charRanking.length > 0 ? Math.max(...charRanking.map((c) => c.count)) : 1;

  return (
    <div className="coc-page-enter mx-auto max-w-2xl px-4 py-8">
      <Link
        href={`/campaigns/${id}`}
        className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        キャンペーン詳細に戻る
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <BarChart2 size={22} className="text-coc-gold shrink-0" />
        <h1 className="font-cinzel text-2xl font-bold text-coc-text">
          {campaign.title as string} — 統計
        </h1>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-xl border border-coc-border bg-coc-surface px-4 py-4 text-center"
          >
            <p className={`text-3xl font-bold ${c.color}`}>{c.value}</p>
            <p className="text-xs text-coc-muted mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      {/* シナリオ進捗 */}
      <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-5 mb-6">
        <p className="font-cinzel text-xs font-medium text-coc-muted uppercase tracking-widest mb-4">
          シナリオ進捗
        </p>
        <div className="flex flex-col gap-3">
          <BarRow label="完了" value={completedScenarios} max={barMax} color="bg-green-500" />
          <BarRow label="進行中" value={ongoingScenarios} max={barMax} color="bg-coc-gold" />
          <BarRow label="準備中" value={planningScenarios} max={barMax} color="bg-coc-muted/50" />
        </div>
        {totalScenarios > 0 && (
          <p className="text-xs text-coc-muted mt-4 text-right">
            達成率: {Math.round((completedScenarios / totalScenarios) * 100)}%
          </p>
        )}
      </div>

      {/* SAN / HP 累計損失 */}
      <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-5 mb-6">
        <p className="font-cinzel text-xs font-medium text-coc-muted uppercase tracking-widest mb-4">
          累計損失
        </p>
        <div className="flex flex-col gap-3">
          <BarRow
            label="SAN 損失"
            value={totalSanLoss}
            max={Math.max(totalSanLoss, totalHpLoss, 1)}
            color="bg-purple-500"
          />
          <BarRow
            label="HP 損失"
            value={totalHpLoss}
            max={Math.max(totalSanLoss, totalHpLoss, 1)}
            color="bg-red-500"
          />
        </div>
      </div>

      {/* 技能成功率 TOP5 */}
      {topSkills.length > 0 ? (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-5 mb-6">
          <p className="font-cinzel text-xs font-medium text-coc-muted uppercase tracking-widest mb-4">
            技能成功率 TOP5
          </p>
          <div className="flex flex-col gap-3">
            {topSkills.map((skill) => (
              <BarRow
                key={skill.name}
                label={skill.name}
                value={skill.rate}
                max={100}
                color="bg-coc-gold"
                suffix="%"
              />
            ))}
          </div>
          <p className="text-xs text-coc-muted mt-3 text-right">
            計 {(diceRows ?? []).length} 回の判定データ（3回以上の技能のみ）
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-5 mb-6">
          <p className="font-cinzel text-xs font-medium text-coc-muted uppercase tracking-widest mb-3">
            技能成功率 TOP5
          </p>
          <p className="text-xs text-coc-muted text-center py-4">
            判定データがまだありません。
          </p>
        </div>
      )}

      {/* 最頻出 NPC TOP3 */}
      {topNpcs.length > 0 ? (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-5 mb-6">
          <p className="font-cinzel text-xs font-medium text-coc-muted uppercase tracking-widest mb-4">
            最頻出 NPC TOP3
          </p>
          <div className="flex flex-col gap-3">
            {topNpcs.map((npc, i) => (
              <BarRow
                key={npc.name}
                label={`${i + 1}. ${npc.name}`}
                value={npc.count}
                max={npcBarMax}
                color="bg-blue-500"
                suffix="回"
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-5 mb-6">
          <p className="font-cinzel text-xs font-medium text-coc-muted uppercase tracking-widest mb-3">
            最頻出 NPC TOP3
          </p>
          <p className="text-xs text-coc-muted text-center py-4">
            NPC 登場データがまだありません。
          </p>
        </div>
      )}

      {/* キャラクター参加シナリオ数ランキング */}
      {charRanking.length > 0 ? (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-5">
          <p className="font-cinzel text-xs font-medium text-coc-muted uppercase tracking-widest mb-4">
            参加シナリオ数ランキング
          </p>
          <div className="flex flex-col gap-3">
            {charRanking.map((char, i) => (
              <BarRow
                key={char.name + i}
                label={`${i + 1}. ${char.name}`}
                value={char.count}
                max={charBarMax}
                color="bg-teal-500"
                suffix="話"
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-5">
          <p className="font-cinzel text-xs font-medium text-coc-muted uppercase tracking-widest mb-3">
            参加シナリオ数ランキング
          </p>
          <p className="text-xs text-coc-muted text-center py-4">
            参加者データがまだありません。
          </p>
        </div>
      )}
    </div>
  );
}
