export const dynamic = "force-dynamic";

import { isSupabaseConfigured } from "@/lib/supabase";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { ACHIEVEMENTS } from "@/app/api/achievements/check/route";

export default async function AchievementsPage() {
  let earnedIds = new Set<string>();

  if (isSupabaseConfigured) {
    const serverClient = await createSupabaseServerClient();

    if (serverClient) {
      const {
        data: { user },
      } = await serverClient.auth.getUser();

      if (user) {
        const { data: userAchievements } = await serverClient
          .from("user_achievements")
          .select("achievement_id")
          .eq("user_id", user.id);

        earnedIds = new Set(
          (userAchievements ?? []).map(
            (a: { achievement_id: string }) => a.achievement_id
          )
        );
      }
    }
  }

  const earnedCount = ACHIEVEMENTS.filter((a) => earnedIds.has(a.id)).length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="font-cinzel text-2xl font-bold text-coc-text mb-1">
          🏅 アチーブメント
        </h1>
        <p className="text-coc-muted text-sm">
          {earnedIds.size > 0
            ? `${earnedCount} / ${ACHIEVEMENTS.length} 個のバッジを獲得済み`
            : "セッション参加・クリティカル成功・SAN喪失などのマイルストーンでバッジが解放されます"}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ACHIEVEMENTS.map((achievement) => {
          const earned = earnedIds.has(achievement.id);
          return (
            <div
              key={achievement.id}
              className={`rounded-lg border p-4 flex items-start gap-3 transition-colors ${
                earned
                  ? "border-coc-gold/40 bg-coc-gold/5"
                  : "border-coc-border bg-coc-surface opacity-50"
              }`}
            >
              <span
                className="text-3xl flex-shrink-0"
                style={!earned ? { filter: "grayscale(100%)" } : undefined}
              >
                {achievement.icon_emoji}
              </span>
              <div className="min-w-0">
                <p
                  className={`font-semibold text-sm leading-tight ${
                    earned ? "text-coc-gold" : "text-coc-muted"
                  }`}
                >
                  {achievement.label}
                </p>
                <p className="text-xs text-coc-muted mt-0.5 leading-relaxed">
                  {achievement.description}
                </p>
                {earned && (
                  <span className="inline-block mt-1.5 text-xs text-green-400 font-medium">
                    ✓ 獲得済み
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
