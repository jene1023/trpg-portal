import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured, AchievementDefinition } from "@/lib/supabase";

const ACHIEVEMENT_SEED: AchievementDefinition[] = [
  {
    id: "first_session",
    label: "初セッション",
    description: "初めてのセッションに参加した",
    icon_emoji: "🎲",
    condition_type: "first_scenario",
    condition_threshold: 1,
  },
  {
    id: "session_5",
    label: "5回の冒険",
    description: "5回のセッションに参加した",
    icon_emoji: "📖",
    condition_type: "session_count",
    condition_threshold: 5,
  },
  {
    id: "session_10",
    label: "ベテラン探索者",
    description: "10回のセッションに参加した",
    icon_emoji: "🔭",
    condition_type: "session_count",
    condition_threshold: 10,
  },
  {
    id: "session_25",
    label: "クトゥルフの申し子",
    description: "25回のセッションに参加した",
    icon_emoji: "🐙",
    condition_type: "session_count",
    condition_threshold: 25,
  },
  {
    id: "critical_1",
    label: "幸運の一振り",
    description: "決定的成功を1回達成した",
    icon_emoji: "⭐",
    condition_type: "critical_success_count",
    condition_threshold: 1,
  },
  {
    id: "critical_10",
    label: "クリティカルマスター",
    description: "決定的成功を10回達成した",
    icon_emoji: "🌟",
    condition_type: "critical_success_count",
    condition_threshold: 10,
  },
  {
    id: "san_loss_10",
    label: "正気の淵にて",
    description: "合計10点のSANを失った",
    icon_emoji: "🧠",
    condition_type: "san_loss_total",
    condition_threshold: 10,
  },
  {
    id: "san_loss_50",
    label: "深淵を覗く者",
    description: "合計50点のSANを失った",
    icon_emoji: "🌀",
    condition_type: "san_loss_total",
    condition_threshold: 50,
  },
  {
    id: "campaign_complete",
    label: "キャンペーン完走",
    description: "キャンペーンを完結させた",
    icon_emoji: "🏆",
    condition_type: "campaign_complete",
    condition_threshold: 1,
  },
  {
    id: "character_3",
    label: "探索者コレクター",
    description: "3人のキャラクターを作成した",
    icon_emoji: "👥",
    condition_type: "character_count",
    condition_threshold: 3,
  },
];

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Supabase が設定されていません。" }, { status: 503 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "リクエストが不正です。" }, { status: 400 });
  }

  const { userId } = body as { userId?: string };
  if (!userId) {
    return NextResponse.json({ error: "userId は必須です。" }, { status: 400 });
  }

  // First get character IDs for this user
  const { data: chars } = await supabase
    .from("characters")
    .select("id")
    .eq("user_id", userId);

  const charIds = (chars ?? []).map((c: { id: string }) => c.id);

  const [
    { data: sessionLogs },
    { data: diceRolls },
    { data: completedCampaigns },
    { data: existingAchievements },
  ] = await Promise.all([
    charIds.length > 0
      ? supabase
          .from("session_logs")
          .select("id, san_loss")
          .in("character_id", charIds)
      : Promise.resolve({ data: [] }),
    charIds.length > 0
      ? supabase
          .from("dice_rolls")
          .select("id")
          .eq("success_level", "critical_success")
          .in("character_id", charIds)
      : Promise.resolve({ data: [] }),
    supabase
      .from("campaigns")
      .select("id")
      .eq("status", "completed"),
    supabase
      .from("user_achievements")
      .select("achievement_id")
      .eq("user_id", userId),
  ]);

  const sessionCount = (sessionLogs ?? []).length;
  const criticalCount = (diceRolls ?? []).length;
  const totalSanLoss = (sessionLogs ?? []).reduce(
    (sum: number, s: { san_loss: number | null }) => sum + (s.san_loss ?? 0),
    0
  );
  const completedCampaignCount = (completedCampaigns ?? []).length;
  const characterCount = charIds.length;

  const alreadyUnlocked = new Set(
    (existingAchievements ?? []).map((a: { achievement_id: string }) => a.achievement_id)
  );

  const newlyUnlocked: string[] = [];

  for (const def of ACHIEVEMENT_SEED) {
    if (alreadyUnlocked.has(def.id)) continue;

    let earned = false;
    switch (def.condition_type) {
      case "first_scenario":
        earned = sessionCount >= def.condition_threshold;
        break;
      case "session_count":
        earned = sessionCount >= def.condition_threshold;
        break;
      case "critical_success_count":
        earned = criticalCount >= def.condition_threshold;
        break;
      case "san_loss_total":
        earned = totalSanLoss >= def.condition_threshold;
        break;
      case "campaign_complete":
        earned = completedCampaignCount >= def.condition_threshold;
        break;
      case "character_count":
        earned = characterCount >= def.condition_threshold;
        break;
    }

    if (earned) {
      newlyUnlocked.push(def.id);
    }
  }

  if (newlyUnlocked.length > 0) {
    await supabase.from("user_achievements").insert(
      newlyUnlocked.map((achievement_id) => ({
        user_id: userId,
        achievement_id,
        unlocked_at: new Date().toISOString(),
      }))
    );
  }

  return NextResponse.json({
    newlyUnlocked,
    sessionCount,
    criticalCount,
    totalSanLoss,
  });
}

export const ACHIEVEMENTS = ACHIEVEMENT_SEED;
