export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type Props = { params: Promise<{ id: string }> };

type Badge = {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  condition: (data: BadgeData) => boolean;
};

type BadgeData = {
  sessionCount: number;
  totalSanLoss: number;
  growthCount: number;
  fumbleCount: number;
  criticalCount: number;
  totalRolls: number;
  madnessCount: number;
  activeMadnessCount: number;
  totalHpLoss: number;
};

const BADGES: Badge[] = [
  {
    id: "veteran",
    name: "ベテラン探索者",
    description: "10回以上のセッションを生き延びた",
    icon: "⚔️",
    color: "border-amber-700/60 bg-amber-950/20 text-amber-300",
    condition: (d) => d.sessionCount >= 10,
  },
  {
    id: "unbroken",
    name: "折れない精神",
    description: "SANを合計30以上喪失しても生き続けた",
    icon: "🧠",
    color: "border-purple-700/60 bg-purple-950/20 text-purple-300",
    condition: (d) => d.totalSanLoss >= 30,
  },
  {
    id: "growth",
    name: "成長の証",
    description: "技能成長を5回以上達成した",
    icon: "📈",
    color: "border-green-700/60 bg-green-950/20 text-green-300",
    condition: (d) => d.growthCount >= 5,
  },
  {
    id: "fumble_king",
    name: "ファンブル常連",
    description: "致命的失敗を5回以上経験した",
    icon: "🎲",
    color: "border-red-700/60 bg-red-950/20 text-red-300",
    condition: (d) => d.fumbleCount >= 5,
  },
  {
    id: "lucky_star",
    name: "幸運の星",
    description: "決定的成功を10回以上達成した",
    icon: "⭐",
    color: "border-yellow-600/60 bg-yellow-950/20 text-yellow-300",
    condition: (d) => d.criticalCount >= 10,
  },
  {
    id: "dice_maniac",
    name: "ダイス中毒",
    description: "合計100回以上の判定を行った",
    icon: "🎯",
    color: "border-blue-700/60 bg-blue-950/20 text-blue-300",
    condition: (d) => d.totalRolls >= 100,
  },
  {
    id: "madness_survivor",
    name: "狂気の生還者",
    description: "狂気症状を3回以上経験した",
    icon: "💀",
    color: "border-pink-700/60 bg-pink-950/20 text-pink-300",
    condition: (d) => d.madnessCount >= 3,
  },
  {
    id: "battle_scarred",
    name: "傷だらけの探索者",
    description: "HP合計喪失が20以上になった",
    icon: "🩸",
    color: "border-rose-700/60 bg-rose-950/20 text-rose-300",
    condition: (d) => d.totalHpLoss >= 20,
  },
  {
    id: "first_session",
    name: "初めての探索",
    description: "初めてのセッションを完了した",
    icon: "🔍",
    color: "border-sky-700/60 bg-sky-950/20 text-sky-300",
    condition: (d) => d.sessionCount >= 1,
  },
  {
    id: "sanity_edge",
    name: "狂気の縁で",
    description: "同時に2つ以上の狂気状態を抱えた",
    icon: "🌀",
    color: "border-violet-700/60 bg-violet-950/20 text-violet-300",
    condition: (d) => d.activeMadnessCount >= 2,
  },
];

export default async function AchievementsPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: char } = await supabase
    .from("characters")
    .select("id, name")
    .eq("id", id)
    .single();

  if (!char) notFound();

  const [
    { data: sessions },
    { data: rolls },
    { data: growth },
    { data: madness },
  ] = await Promise.all([
    supabase.from("sessions").select("san_loss, hp_loss").eq("character_id", id),
    supabase.from("dice_rolls").select("success_level").eq("character_id", id),
    supabase.from("growth_history").select("id").eq("character_id", id),
    supabase.from("madness_records").select("is_active").eq("character_id", id),
  ]);

  const sessionList = sessions ?? [];
  const rollList = rolls ?? [];
  const growthList = growth ?? [];
  const madnessList = madness ?? [];

  const badgeData: BadgeData = {
    sessionCount: sessionList.length,
    totalSanLoss: sessionList.reduce((sum, s) => sum + (s.san_loss ?? 0), 0),
    totalHpLoss: sessionList.reduce((sum, s) => sum + (s.hp_loss ?? 0), 0),
    growthCount: growthList.length,
    fumbleCount: rollList.filter((r) => r.success_level === "fumble").length,
    criticalCount: rollList.filter((r) => r.success_level === "critical_success").length,
    totalRolls: rollList.length,
    madnessCount: madnessList.length,
    activeMadnessCount: madnessList.filter((m) => m.is_active).length,
  };

  const achieved = BADGES.filter((b) => b.condition(badgeData));
  const notAchieved = BADGES.filter((b) => !b.condition(badgeData));

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

      <h1 className="font-cinzel text-xl font-bold text-coc-text mb-1">実績・称号</h1>
      <p className="text-xs text-coc-muted mb-8">
        {achieved.length}/{BADGES.length}個の実績を達成
      </p>

      {achieved.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest mb-4">
            達成済み — {achieved.length}件
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {achieved.map((badge) => (
              <div
                key={badge.id}
                className={`rounded-lg border p-4 flex items-start gap-3 ${badge.color}`}
              >
                <span className="text-2xl leading-none shrink-0">{badge.icon}</span>
                <div>
                  <p className="font-semibold text-sm">{badge.name}</p>
                  <p className="text-xs opacity-80 mt-0.5 leading-relaxed">{badge.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {notAchieved.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest mb-4">
            未達成 — {notAchieved.length}件
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {notAchieved.map((badge) => (
              <div
                key={badge.id}
                className="rounded-lg border border-coc-border bg-coc-surface/50 p-4 flex items-start gap-3 opacity-50 grayscale"
              >
                <span className="text-2xl leading-none shrink-0">{badge.icon}</span>
                <div>
                  <p className="font-semibold text-sm text-coc-muted">{badge.name}</p>
                  <p className="text-xs text-coc-muted mt-0.5 leading-relaxed">{badge.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {achieved.length === 0 && (
        <div className="rounded-lg border border-coc-border bg-coc-surface p-8 text-center text-coc-muted text-sm">
          まだ実績を獲得していません。
          <br />
          <span className="block mt-1">セッションに参加して探索を続けましょう。</span>
        </div>
      )}

      <div className="mt-8 rounded-lg border border-coc-border bg-coc-surface p-4 space-y-2">
        <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest mb-3">集計データ</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div>
            <p className="text-xs text-coc-muted">セッション数</p>
            <p className="font-cinzel text-lg font-bold text-coc-text">{badgeData.sessionCount}</p>
          </div>
          <div>
            <p className="text-xs text-coc-muted">累計SAN喪失</p>
            <p className="font-cinzel text-lg font-bold text-purple-400">{badgeData.totalSanLoss}</p>
          </div>
          <div>
            <p className="text-xs text-coc-muted">技能成長回数</p>
            <p className="font-cinzel text-lg font-bold text-green-400">{badgeData.growthCount}</p>
          </div>
          <div>
            <p className="text-xs text-coc-muted">総判定数</p>
            <p className="font-cinzel text-lg font-bold text-coc-gold">{badgeData.totalRolls}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
