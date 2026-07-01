export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  Users,
  BookOpen,
  ChevronRight,
  Scroll,
  Ghost,
  Search,
  Calendar,
  Pin,
  Clock,
} from "lucide-react";
import { supabase, isSupabaseConfigured, CharacterWithSkills, Scenario } from "@/lib/supabase";
import CharacterCard from "./_components/CharacterCard";

const tiles = [
  {
    href: "/characters",
    icon: Users,
    title: "キャラクター",
    desc: "探索者の記録を管理する",
    available: true,
  },
  {
    href: "/scenarios",
    icon: Scroll,
    title: "シナリオ",
    desc: "シナリオと参加者を管理する",
    available: true,
  },
  {
    href: "/npcs",
    icon: Ghost,
    title: "NPC",
    desc: "登場人物を記録する",
    available: true,
  },
  {
    href: "/rules",
    icon: BookOpen,
    title: "ルールリファレンス",
    desc: "技能・判定・戦闘ルールを確認する",
    available: true,
  },
  {
    href: "/search",
    icon: Search,
    title: "検索",
    desc: "キャラ・NPC・シナリオを横断検索する",
    available: true,
  },
  {
    href: "/calendar",
    icon: Calendar,
    title: "カレンダー",
    desc: "次回セッション予定を月表示で確認する",
    available: true,
  },
];

export default async function HomePage() {
  let recent: CharacterWithSkills[] | null = null;
  let pinned: CharacterWithSkills[] | null = null;
  let ongoingScenarios: Scenario[] | null = null;

  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nowIso = now.toISOString();
  const weekFromNowIso = weekFromNow.toISOString();

  if (isSupabaseConfigured) {
    const [recentRes, pinnedRes, ongoingRes] = await Promise.all([
      supabase
        .from("characters")
        .select("*, character_skills(*)")
        .order("updated_at", { ascending: false })
        .limit(5),
      supabase
        .from("characters")
        .select("*, character_skills(*)")
        .eq("is_pinned", true)
        .order("updated_at", { ascending: false }),
      supabase
        .from("scenarios")
        .select("*")
        .eq("status", "ongoing")
        .order("next_session_at", { ascending: true }),
    ]);
    recent = recentRes.data as CharacterWithSkills[];
    pinned = pinnedRes.data as CharacterWithSkills[];
    ongoingScenarios = ongoingRes.data as Scenario[];
  }

  const configured = isSupabaseConfigured;

  const upcomingSessions = ongoingScenarios?.filter((s) => {
    if (!s.next_session_at) return false;
    return s.next_session_at >= nowIso && s.next_session_at <= weekFromNowIso;
  }) ?? [];

  return (
    <div className="coc-page-enter mx-auto max-w-5xl px-4 py-12 space-y-12">
      {/* Supabase未設定バナー */}
      {!configured && (
        <div className="rounded-lg border border-coc-gold-dim bg-coc-raised px-4 py-3 text-sm text-coc-muted">
          <span className="text-coc-gold font-medium">セットアップ未完了: </span>
          Supabase の URL と ANON KEY を{" "}
          <code className="text-coc-text bg-coc-void px-1 rounded">.env.local</code>{" "}
          に設定するとデータが保存できます。
        </div>
      )}

      {/* ヒーロー */}
      <div className="text-center space-y-3">
        <p className="text-coc-muted text-sm tracking-[0.2em] uppercase font-cinzel">
          Cthulhu Mythos TRPG
        </p>
        <h1 className="font-cinzel text-3xl sm:text-4xl font-bold text-coc-text">
          CoC Portal
        </h1>
        <div className="flex items-center justify-center gap-3 text-coc-faint text-lg">
          <span className="flex-1 border-t border-coc-border" />
          <span className="text-coc-gold select-none coc-star-twinkle">✦</span>
          <span className="flex-1 border-t border-coc-border" />
        </div>
        <p className="font-crimson text-coc-muted text-base sm:text-lg italic tracking-wide">
          <span
            className="font-crimson text-4xl sm:text-5xl text-coc-gold-dim leading-none relative -top-1 mr-1 opacity-40 select-none"
            aria-hidden="true"
          >&ldquo;</span>
          深淵をのぞき込むとき、深淵もまたのぞき込んでいる
          <span
            className="font-crimson text-4xl sm:text-5xl text-coc-gold-dim leading-none relative top-2 ml-1 opacity-40 select-none"
            aria-hidden="true"
          >&rdquo;</span>
        </p>
      </div>

      {/* タイル */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 coc-stagger-grid">
        {tiles.map(({ href, icon: Icon, title, desc, available }) => (
          <Link
            key={href}
            href={href}
            className={`group relative rounded-lg border coc-card-bg p-5 space-y-3 transition-all duration-300 ease-out ${
              available
                ? "border-coc-border hover:border-coc-border-glow hover:shadow-[0_4px_18px_rgba(201,133,58,0.25)] motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-[0.98] motion-safe:active:translate-y-0 coc-tile-shimmer"
                : "border-coc-border opacity-50 pointer-events-none"
            }`}
          >
            {!available && (
              <span className="absolute top-2 right-2 rounded-full border border-coc-border px-2 py-0.5 text-xs text-coc-faint">
                準備中
              </span>
            )}
            <Icon size={24} className={available ? "text-coc-gold" : "text-coc-faint"} />
            <div>
              <p className="font-cinzel text-sm font-semibold text-coc-text">{title}</p>
              <p className="text-xs text-coc-muted mt-1 leading-relaxed">{desc}</p>
            </div>
            {available && (
              <ChevronRight
                size={16}
                className="absolute bottom-4 right-4 text-coc-faint group-hover:text-coc-gold transition-all duration-300 motion-safe:group-hover:translate-x-0.5"
              />
            )}
          </Link>
        ))}
      </div>

      {/* 今週の予定 */}
      {upcomingSessions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-coc-gold" />
            <h2 className="coc-section-title font-cinzel text-sm font-semibold text-coc-muted uppercase tracking-widest">
              今週の予定
            </h2>
          </div>
          <div className="space-y-2">
            {upcomingSessions.map((scenario) => {
              const date = scenario.next_session_at
                ? new Date(scenario.next_session_at).toLocaleDateString("ja-JP", {
                    month: "long",
                    day: "numeric",
                    weekday: "short",
                  })
                : "";
              return (
                <Link
                  key={scenario.id}
                  href={`/scenarios/${scenario.id}`}
                  className="flex items-center justify-between rounded-lg border border-coc-gold-dim bg-coc-raised px-4 py-3 hover:border-coc-gold transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-coc-text">{scenario.title}</p>
                    <p className="text-xs text-coc-muted mt-0.5">{date}</p>
                  </div>
                  <ChevronRight size={14} className="text-coc-faint" />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ピン留めキャラクター */}
      {pinned && pinned.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Pin size={14} className="text-coc-gold" />
              <h2 className="coc-section-title font-cinzel text-sm font-semibold text-coc-muted uppercase tracking-widest">
                ピン留めキャラクター
              </h2>
            </div>
            <Link href="/characters" className="text-xs text-coc-gold hover:underline">
              すべて表示
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 coc-stagger-grid">
            {pinned.map((char) => (
              <CharacterCard
                key={char.id}
                character={char}
                skills={char.character_skills}
              />
            ))}
          </div>
        </div>
      )}

      {/* 進行中シナリオ */}
      {ongoingScenarios && ongoingScenarios.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scroll size={14} className="text-coc-gold" />
              <h2 className="coc-section-title font-cinzel text-sm font-semibold text-coc-muted uppercase tracking-widest">
                進行中シナリオ
              </h2>
            </div>
            <Link href="/scenarios" className="text-xs text-coc-gold hover:underline">
              すべて表示
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ongoingScenarios.map((scenario) => {
              const nextDate = scenario.next_session_at
                ? new Date(scenario.next_session_at).toLocaleDateString("ja-JP", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : null;
              return (
                <Link
                  key={scenario.id}
                  href={`/scenarios/${scenario.id}`}
                  className="group rounded-lg border border-coc-border coc-card-bg p-4 space-y-2 hover:border-coc-border-glow transition-colors"
                >
                  <p className="font-cinzel text-sm font-semibold text-coc-text group-hover:text-coc-gold transition-colors">
                    {scenario.title}
                  </p>
                  {scenario.synopsis && (
                    <p className="text-xs text-coc-muted line-clamp-2">{scenario.synopsis}</p>
                  )}
                  {nextDate && (
                    <p className="text-xs text-coc-gold">次回: {nextDate}</p>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* 最近のキャラクター */}
      {recent && recent.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="coc-section-title font-cinzel text-sm font-semibold text-coc-muted uppercase tracking-widest">
              最近のキャラクター
            </h2>
            <Link href="/characters" className="text-xs text-coc-gold hover:underline">
              すべて表示
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 coc-stagger-grid">
            {recent.map((char) => (
              <CharacterCard
                key={char.id}
                character={char}
                skills={char.character_skills}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
