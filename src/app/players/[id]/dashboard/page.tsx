export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft, BarChart2, User } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type Props = { params: Promise<{ id: string }> };

function HBarRow({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 text-xs text-coc-muted truncate text-right">{label}</span>
      <div className="flex-1 h-3 bg-coc-raised rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all bg-purple-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-right text-xs text-coc-text">{value}</span>
    </div>
  );
}

export default async function PlayerDashboardPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 text-center text-coc-muted">
        Supabase が未設定です。
      </div>
    );
  }

  const [{ data: player }, { data: participations }] = await Promise.all([
    supabase.from("players").select("id, display_name").eq("id", id).single(),
    supabase
      .from("scenario_participants")
      .select("character_id, scenario_id")
      .eq("player_id", id),
  ]);

  if (!player) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 text-center text-coc-muted">
        プレイヤーが見つかりません。
      </div>
    );
  }

  const characterIds = [
    ...new Set((participations ?? []).map((p) => p.character_id as string)),
  ];
  const scenarioIds = [
    ...new Set((participations ?? []).map((p) => p.scenario_id as string)),
  ];

  const campaignCount =
    scenarioIds.length > 0
      ? await supabase
          .from("campaign_scenarios")
          .select("campaign_id")
          .in("scenario_id", scenarioIds)
          .then(
            ({ data }) =>
              new Set((data ?? []).map((r) => r.campaign_id as string)).size
          )
      : 0;

  const [
    { data: characters },
    { data: sessionRows },
    { data: growthRows },
    { data: clueRows },
  ] = await Promise.all([
    characterIds.length > 0
      ? supabase
          .from("characters")
          .select("id, name, status, occupation, san_current, san_max")
          .in("id", characterIds)
      : Promise.resolve({ data: [] as { id: string; name: string; status: string; occupation: string | null; san_current: number; san_max: number }[] }),
    characterIds.length > 0
      ? supabase
          .from("sessions")
          .select("character_id, san_loss")
          .in("character_id", characterIds)
      : Promise.resolve({ data: [] as { character_id: string; san_loss: number }[] }),
    characterIds.length > 0
      ? supabase
          .from("growth_history")
          .select("character_id")
          .in("character_id", characterIds)
      : Promise.resolve({ data: [] as { character_id: string }[] }),
    characterIds.length > 0
      ? supabase
          .from("scenario_clues")
          .select("character_id")
          .in("character_id", characterIds)
      : Promise.resolve({ data: [] as { character_id: string }[] }),
  ]);

  const charList = characters ?? [];
  const sessions = sessionRows ?? [];
  const growths = growthRows ?? [];
  const clues = clueRows ?? [];

  type CharStat = {
    id: string;
    name: string;
    status: string;
    occupation: string | null;
    sanCurrent: number;
    sanMax: number;
    sessionCount: number;
    totalSanLoss: number;
    growthCount: number;
    clueCount: number;
  };

  const charStats: CharStat[] = charList.map((c) => {
    const cSessions = sessions.filter((s) => s.character_id === c.id);
    return {
      id: c.id,
      name: c.name,
      status: c.status,
      occupation: c.occupation,
      sanCurrent: c.san_current,
      sanMax: c.san_max,
      sessionCount: cSessions.length,
      totalSanLoss: cSessions.reduce(
        (sum, s) => sum + ((s.san_loss as number) ?? 0),
        0
      ),
      growthCount: growths.filter((g) => g.character_id === c.id).length,
      clueCount: clues.filter((cl) => cl.character_id === c.id).length,
    };
  });

  charStats.sort((a, b) => b.sessionCount - a.sessionCount);

  const totalSessions = sessions.length;
  const mostPlayedChar = charStats[0] ?? null;
  const maxSanLoss = Math.max(...charStats.map((c) => c.totalSanLoss), 1);

  const STATUS_LABELS: Record<string, string> = {
    alive: "生存",
    dead: "死亡",
    insane: "狂気",
    retired: "引退",
  };
  const STATUS_COLORS: Record<string, string> = {
    alive: "text-green-400 border-green-800",
    dead: "text-red-400 border-red-900",
    insane: "text-purple-400 border-purple-900",
    retired: "text-coc-muted border-coc-border",
  };

  return (
    <div className="coc-page-enter mx-auto max-w-3xl px-4 py-8">
      <Link
        href={`/players/${id}`}
        className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        プレイヤー詳細に戻る
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <BarChart2 size={22} className="text-coc-gold shrink-0" />
        <h1 className="font-cinzel text-2xl font-bold text-coc-text">
          {(player as { display_name: string }).display_name} — 個人統計
        </h1>
      </div>

      {/* ハイライト3枚カード */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="rounded-xl border border-coc-border bg-coc-surface px-4 py-4 text-center">
          <p className="text-3xl font-bold text-coc-gold">{campaignCount}</p>
          <p className="text-xs text-coc-muted mt-1">キャンペーン参加数</p>
        </div>
        <div className="rounded-xl border border-coc-border bg-coc-surface px-4 py-4 text-center">
          <p className="text-3xl font-bold text-coc-text">{totalSessions}</p>
          <p className="text-xs text-coc-muted mt-1">総セッション数</p>
        </div>
        <div className="rounded-xl border border-coc-border bg-coc-surface px-4 py-4 text-center">
          <p className="text-base font-bold text-coc-text truncate">
            {mostPlayedChar?.name ?? "—"}
          </p>
          <p className="text-xs text-coc-muted mt-1">最多プレイキャラ</p>
        </div>
      </div>

      {charStats.length === 0 ? (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-8 text-center text-coc-muted">
          キャラクターが見つかりません。
        </div>
      ) : (
        <>
          {/* キャラクター別統計カードグリッド */}
          <h2 className="font-cinzel text-sm font-semibold text-coc-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <User size={14} />
            キャラクター別統計
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {charStats.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1 mr-2">
                    <p className="font-bold text-coc-text truncate">{c.name}</p>
                    {c.occupation && (
                      <p className="text-xs text-coc-muted truncate">{c.occupation}</p>
                    )}
                  </div>
                  <span
                    className={`text-xs border rounded px-1.5 py-0.5 shrink-0 ${STATUS_COLORS[c.status] ?? "text-coc-muted border-coc-border"}`}
                  >
                    {STATUS_LABELS[c.status] ?? c.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-center">
                    <p className="text-xl font-bold text-coc-text">{c.sessionCount}</p>
                    <p className="text-[10px] text-coc-muted">セッション</p>
                  </div>
                  <div className="rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-center">
                    <p className="text-xl font-bold text-purple-400">{c.totalSanLoss}</p>
                    <p className="text-[10px] text-coc-muted">SAN 損失</p>
                  </div>
                  <div className="rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-center">
                    <p className="text-xl font-bold text-coc-gold">{c.growthCount}</p>
                    <p className="text-[10px] text-coc-muted">技能成長</p>
                  </div>
                  <div className="rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-center">
                    <p className="text-xl font-bold text-green-400">{c.clueCount}</p>
                    <p className="text-[10px] text-coc-muted">取得クルー</p>
                  </div>
                </div>
                {/* SAN現在値バー */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-coc-muted shrink-0">SAN</span>
                  <div className="flex-1 h-1.5 bg-coc-raised rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-purple-500"
                      style={{
                        width: `${c.sanMax > 0 ? Math.round((c.sanCurrent / c.sanMax) * 100) : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-coc-muted shrink-0">
                    {c.sanCurrent}/{c.sanMax}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* キャラクター別SAN損失 横棒グラフ */}
          <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-5">
            <p className="font-cinzel text-xs font-medium text-coc-muted uppercase tracking-widest mb-4">
              キャラクター別 SAN 損失比較
            </p>
            <div className="flex flex-col gap-3">
              {charStats.map((c) => (
                <HBarRow
                  key={c.id}
                  label={c.name}
                  value={c.totalSanLoss}
                  max={maxSanLoss}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
