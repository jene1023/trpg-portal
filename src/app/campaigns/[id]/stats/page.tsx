import Link from "next/link";
import { ArrowLeft, BarChart2 } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

type StatCard = { label: string; value: string | number; sub?: string; color?: string };

function BarRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 text-xs text-coc-muted text-right">{label}</span>
      <div className="flex-1 h-3 bg-coc-raised rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `calc(${pct}%)` }}
        />
      </div>
      <span className="w-8 text-right text-xs text-coc-text">{value}</span>
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

  const [
    { data: scenarios },
    { data: participants },
    { data: sessions },
    { data: deadChars },
  ] = await Promise.all([
    scenarioIds.length > 0
      ? supabase.from("scenarios").select("id, status").in("id", scenarioIds)
      : Promise.resolve({ data: [] }),
    scenarioIds.length > 0
      ? supabase.from("scenario_participants").select("id, scenario_id").in("scenario_id", scenarioIds)
      : Promise.resolve({ data: [] }),
    scenarioIds.length > 0
      ? (async () => {
          const { data: participantRows } = await supabase
            .from("scenario_participants")
            .select("character_id")
            .in("scenario_id", scenarioIds);
          const charIds = [...new Set((participantRows ?? []).map((p) => p.character_id as string))];
          if (charIds.length === 0) return { data: [] };
          return supabase.from("sessions").select("san_loss, hp_loss").in("character_id", charIds);
        })()
      : Promise.resolve({ data: [] }),
    supabase.from("characters").select("id, status").in("status", ["dead", "retired"]),
  ]);

  const scenarioList = scenarios ?? [];
  const participantList = participants ?? [];
  const sessionList = sessions ?? [];

  const totalScenarios = scenarioList.length;
  const completedScenarios = scenarioList.filter((s) => s.status === "completed").length;
  const ongoingScenarios = scenarioList.filter((s) => s.status === "ongoing").length;
  const planningScenarios = scenarioList.filter((s) => s.status === "planning").length;

  const totalParticipants = participantList.length;

  const totalSanLoss = sessionList.reduce((sum, s) => sum + ((s.san_loss as number) ?? 0), 0);
  const totalHpLoss = sessionList.reduce((sum, s) => sum + ((s.hp_loss as number) ?? 0), 0);

  // dead/retired characters that participated in campaign scenarios
  const campaignCharIds = new Set(participantList.map((p) => p.character_id as string));
  const deadRetiredCount = (deadChars ?? []).filter((c) => campaignCharIds.has(c.id)).length;

  const cards: StatCard[] = [
    { label: "総シナリオ数", value: totalScenarios, color: "text-coc-text" },
    { label: "完了シナリオ", value: completedScenarios, color: "text-green-400" },
    { label: "のべ参加者数", value: totalParticipants, color: "text-coc-gold" },
    { label: "累計SAN損失", value: totalSanLoss, color: "text-purple-400" },
    { label: "累計HP損失", value: totalHpLoss, color: "text-red-400" },
    { label: "死亡/引退キャラ", value: deadRetiredCount, color: "text-coc-muted" },
  ];

  const barMax = Math.max(completedScenarios, ongoingScenarios, planningScenarios, 1);

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
          {campaign.title} — 統計
        </h1>
      </div>

      {/* 数値カード */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-coc-border bg-coc-surface px-4 py-4 text-center">
            <p className={`text-3xl font-bold ${c.color}`}>{c.value}</p>
            <p className="text-xs text-coc-muted mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      {/* シナリオステータス棒グラフ */}
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

      {/* SAN/HP 損失棒グラフ */}
      <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-5">
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
    </div>
  );
}
