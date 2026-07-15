export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, User, Edit3, Users, BookOpen, Dice5, Brain, Eye, EyeOff, BarChart2 } from "lucide-react";
import { supabase, isSupabaseConfigured, PlayerProfile, Character } from "@/lib/supabase";
import StatusBadge from "@/app/_components/StatusBadge";

type Props = { params: Promise<{ userId: string }> };

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-coc-border bg-coc-raised px-4 py-3 text-center">
      <p className="text-xs text-coc-muted mb-1">{label}</p>
      <p className="text-xl font-bold text-coc-gold">{value}</p>
    </div>
  );
}

export default async function PlayerProfilePage({ params }: Props) {
  const { userId } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: profileData } = await supabase
    .from("player_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  const profile = profileData as PlayerProfile | null;

  const [
    { data: charsData },
    { data: sessionLogsData },
    { data: diceRollsData },
  ] = await Promise.all([
    supabase.from("characters").select("id, name, occupation, portrait_url, avatar_url, status, hp_current, hp_max, san_current, san_max").order("updated_at", { ascending: false }),
    supabase.from("session_logs").select("id, san_loss"),
    supabase.from("dice_rolls").select("id"),
  ]);

  const characters = (charsData ?? []) as Pick<Character, "id" | "name" | "occupation" | "portrait_url" | "avatar_url" | "status" | "hp_current" | "hp_max" | "san_current" | "san_max">[];
  const sessionLogs = sessionLogsData ?? [];
  const diceRolls = diceRollsData ?? [];

  const totalSanLoss = (sessionLogs as { id: string; san_loss: number }[]).reduce(
    (sum, s) => sum + (s.san_loss ?? 0),
    0
  );

  const occupationCounts: Record<string, number> = {};
  for (const c of characters) {
    if (c.occupation) {
      occupationCounts[c.occupation] = (occupationCounts[c.occupation] ?? 0) + 1;
    }
  }
  const topOccupation =
    Object.entries(occupationCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  const displayName = profile?.display_name ?? "プレイヤー";

  return (
    <div className="coc-page-enter mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          ホーム
        </Link>
      </div>

      {/* プロフィールヘッダー */}
      <div className="rounded-xl border border-coc-border bg-coc-surface px-6 py-5 mb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-coc-gold-dim bg-coc-raised text-coc-gold">
              <User size={22} />
            </div>
            <div>
              <h1 className="font-cinzel text-xl font-bold text-coc-text">{displayName}</h1>
              {profile && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  {profile.is_public ? (
                    <span className="flex items-center gap-1 text-xs text-green-400">
                      <Eye size={11} />
                      公開中
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-coc-muted">
                      <EyeOff size={11} />
                      非公開
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/profile/report"
              className="flex items-center gap-1.5 rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-xs text-coc-muted hover:text-coc-text hover:border-coc-gold-dim transition-colors"
            >
              <BarChart2 size={13} />
              プレイレポート
            </Link>
            <Link
              href="/profile/edit"
              className="flex items-center gap-1.5 rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-xs text-coc-muted hover:text-coc-text hover:border-coc-gold-dim transition-colors"
            >
              <Edit3 size={13} />
              編集
            </Link>
          </div>
        </div>

        {profile?.bio && (
          <p className="mt-3 text-sm text-coc-text whitespace-pre-wrap leading-relaxed border-l-2 border-coc-gold-dim pl-3">
            {profile.bio}
          </p>
        )}

        {profile?.play_style && profile.play_style.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {profile.play_style.map((style) => (
              <span
                key={style}
                className="rounded-full border border-coc-gold-dim bg-coc-gold/10 px-2.5 py-0.5 text-xs text-coc-gold"
              >
                {style}
              </span>
            ))}
          </div>
        )}

        {!profile && (
          <p className="mt-3 text-sm text-coc-muted italic">
            プロフィールが未設定です。
            <Link href="/profile/edit" className="ml-1 text-coc-gold hover:underline">
              今すぐ設定する
            </Link>
          </p>
        )}
      </div>

      {/* 実績統計 */}
      <section className="mb-5">
        <h2 className="font-cinzel text-sm font-semibold text-coc-muted uppercase tracking-wider mb-3">
          プレイ実績
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatTile label="キャラクター数" value={characters.length} />
          <StatTile label="総セッション数" value={sessionLogs.length} />
          <StatTile label="総ダイス判定数" value={diceRolls.length} />
          <StatTile label="累計SAN喪失" value={totalSanLoss} />
        </div>
        {topOccupation !== "—" && (
          <div className="mt-3 rounded-lg border border-coc-border bg-coc-raised px-4 py-3 flex items-center gap-3">
            <BookOpen size={15} className="text-coc-gold shrink-0" />
            <span className="text-xs text-coc-muted">最多使用職業</span>
            <span className="text-sm font-medium text-coc-text">{topOccupation}</span>
          </div>
        )}
      </section>

      {/* キャラクター一覧 */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-cinzel text-sm font-semibold text-coc-muted uppercase tracking-wider flex items-center gap-1.5">
            <Users size={14} />
            キャラクターポートフォリオ
          </h2>
          <Link
            href="/characters"
            className="text-xs text-coc-muted hover:text-coc-gold transition-colors"
          >
            すべて見る →
          </Link>
        </div>

        {characters.length === 0 ? (
          <p className="text-sm text-coc-muted italic">
            キャラクターがまだいません。
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {characters.map((c) => (
              <Link
                key={c.id}
                href={`/characters/${c.id}`}
                className="group flex items-center gap-3 rounded-xl border border-coc-border bg-coc-surface px-4 py-3 hover:border-coc-gold-dim hover:bg-coc-raised transition-colors"
              >
                {/* サムネイル */}
                <div className="h-12 w-12 shrink-0 rounded-lg overflow-hidden border border-coc-border bg-coc-raised">
                  {c.avatar_url ?? c.portrait_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={(c.avatar_url ?? c.portrait_url) as string}
                      alt={c.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-coc-faint">
                      <User size={18} />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-coc-text text-sm truncate">{c.name}</span>
                    <StatusBadge status={c.status} />
                  </div>
                  {c.occupation && (
                    <p className="text-xs text-coc-muted truncate mt-0.5">{c.occupation}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-xs text-coc-faint">
                    <span className="flex items-center gap-0.5">
                      <Brain size={10} />
                      SAN {c.san_current}/{c.san_max}
                    </span>
                    <span>
                      HP {c.hp_current}/{c.hp_max}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
