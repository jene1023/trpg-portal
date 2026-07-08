export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  Pin,
  Scroll,
  BookMarked,
  Mail,
  ChevronRight,
  LayoutDashboard,
  Users,
  Brain,
  Dice6,
} from "lucide-react";
import {
  supabase,
  isSupabaseConfigured,
  CharacterWithSkills,
  Scenario,
  SessionLog,
  MadnessRecord,
} from "@/lib/supabase";
import CharacterCard from "../_components/CharacterCard";

type SessionWithCharacter = SessionLog & { characters: { name: string } | null };
type MadnessWithCharacter = MadnessRecord & {
  characters: { name: string; id: string } | null;
};

export default async function DashboardPage() {
  let pinned: CharacterWithSkills[] = [];
  let ongoingScenarios: Scenario[] = [];
  let recentSessions: SessionWithCharacter[] = [];
  let unreadCount = 0;
  let activeMadness: MadnessWithCharacter[] = [];
  let recentRollCount = 0;

  if (isSupabaseConfigured) {
    const [pinnedRes, ongoingRes, sessionsRes, unreadRes, madnessRes, rollsRes] =
      await Promise.all([
        supabase
          .from("characters")
          .select("*, character_skills(*)")
          .eq("is_pinned", true)
          .order("updated_at", { ascending: false }),
        supabase
          .from("scenarios")
          .select("*")
          .eq("status", "ongoing")
          .order("next_session_at", { ascending: true })
          .limit(5),
        supabase
          .from("sessions")
          .select("*, characters(name)")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("character_messages")
          .select("id", { count: "exact", head: true })
          .eq("is_read", false),
        supabase
          .from("madness_records")
          .select("*, characters(name, id)")
          .eq("is_active", true)
          .limit(5),
        supabase
          .from("dice_rolls")
          .select("id", { count: "exact", head: true }),
      ]);

    pinned = (pinnedRes.data ?? []) as CharacterWithSkills[];
    ongoingScenarios = (ongoingRes.data ?? []) as Scenario[];
    recentSessions = (sessionsRes.data ?? []) as SessionWithCharacter[];
    unreadCount = unreadRes.count ?? 0;
    activeMadness = (madnessRes.data ?? []) as MadnessWithCharacter[];
    recentRollCount = rollsRes.count ?? 0;
  }

  return (
    <div className="coc-page-enter mx-auto max-w-5xl px-4 py-10 space-y-10">
      {/* ヘッダー */}
      <div className="flex items-center gap-3">
        <LayoutDashboard size={22} className="text-coc-gold" />
        <h1 className="font-cinzel text-2xl font-bold text-coc-text">ダッシュボード</h1>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link
          href="/characters"
          className="rounded-lg border border-coc-border coc-card-bg p-4 space-y-1 hover:border-coc-border-glow transition-all"
        >
          <div className="flex items-center gap-2 text-coc-muted text-xs font-cinzel uppercase tracking-widest">
            <Pin size={12} className="text-coc-gold" />
            ピン留め
          </div>
          <p className="text-2xl font-bold text-coc-text">{pinned.length}</p>
          <p className="text-xs text-coc-muted">キャラクター</p>
        </Link>

        <Link
          href="/scenarios"
          className="rounded-lg border border-coc-border coc-card-bg p-4 space-y-1 hover:border-coc-border-glow transition-all"
        >
          <div className="flex items-center gap-2 text-coc-muted text-xs font-cinzel uppercase tracking-widest">
            <Scroll size={12} className="text-coc-gold" />
            進行中
          </div>
          <p className="text-2xl font-bold text-coc-text">{ongoingScenarios.length}</p>
          <p className="text-xs text-coc-muted">シナリオ</p>
        </Link>

        <Link
          href="/characters"
          className="rounded-lg border border-coc-border coc-card-bg p-4 space-y-1 hover:border-coc-border-glow transition-all"
        >
          <div className="flex items-center gap-2 text-coc-muted text-xs font-cinzel uppercase tracking-widest">
            <Mail size={12} className={unreadCount > 0 ? "text-amber-400" : "text-coc-gold"} />
            未読メッセージ
          </div>
          <p className={`text-2xl font-bold ${unreadCount > 0 ? "text-amber-400" : "text-coc-text"}`}>
            {unreadCount}
          </p>
          <p className="text-xs text-coc-muted">件</p>
        </Link>

        <div className="rounded-lg border border-coc-border coc-card-bg p-4 space-y-1">
          <div className="flex items-center gap-2 text-coc-muted text-xs font-cinzel uppercase tracking-widest">
            <Dice6 size={12} className="text-coc-gold" />
            総ロール数
          </div>
          <p className="text-2xl font-bold text-coc-text">{recentRollCount}</p>
          <p className="text-xs text-coc-muted">回</p>
        </div>
      </div>

      {/* ピン留めキャラクター */}
      {pinned.length > 0 ? (
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
              <CharacterCard key={char.id} character={char} skills={char.character_skills} />
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-coc-border p-6 text-center">
          <Users size={24} className="mx-auto text-coc-faint mb-2" />
          <p className="text-sm text-coc-muted">
            ピン留めキャラクターがありません。
            <Link href="/characters" className="text-coc-gold hover:underline ml-1">
              キャラクター一覧
            </Link>
            でピン留めを設定できます。
          </p>
        </div>
      )}

      {/* 進行中シナリオ */}
      {ongoingScenarios.length > 0 && (
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
                  className="group rounded-lg border border-coc-border coc-card-bg p-4 space-y-2 hover:border-coc-border-glow hover:shadow-[0_4px_18px_rgba(201,133,58,0.18)] transition-all motion-safe:hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-cinzel text-sm font-semibold text-coc-text group-hover:text-coc-gold transition-colors">
                      {scenario.title}
                    </p>
                    <ChevronRight size={14} className="text-coc-faint flex-shrink-0 mt-0.5" />
                  </div>
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

      {/* 直近セッションログ */}
      {recentSessions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <BookMarked size={14} className="text-coc-gold" />
            <h2 className="coc-section-title font-cinzel text-sm font-semibold text-coc-muted uppercase tracking-widest">
              直近のセッションログ
            </h2>
          </div>
          <div className="space-y-2">
            {recentSessions.map((session) => {
              const date = session.created_at
                ? new Date(session.created_at).toLocaleDateString("ja-JP", {
                    month: "long",
                    day: "numeric",
                  })
                : "";
              return (
                <Link
                  key={session.id}
                  href={`/characters/${session.character_id}/sessions`}
                  className="flex items-center justify-between rounded-lg border border-coc-border coc-card-bg px-4 py-3 hover:border-coc-border-glow transition-all motion-safe:hover:-translate-y-px"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-coc-text truncate">{session.title}</p>
                    <p className="text-xs text-coc-muted mt-0.5">
                      {session.characters?.name ?? "不明"} · {date}
                      {session.san_loss > 0 && (
                        <span className="ml-2 text-red-400">SAN -{session.san_loss}</span>
                      )}
                      {session.hp_loss > 0 && (
                        <span className="ml-2 text-orange-400">HP -{session.hp_loss}</span>
                      )}
                    </p>
                  </div>
                  <ChevronRight size={14} className="text-coc-faint flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* アクティブ狂気状態 */}
      {activeMadness.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Brain size={14} className="text-red-400" />
            <h2 className="coc-section-title font-cinzel text-sm font-semibold text-coc-muted uppercase tracking-widest">
              アクティブな狂気状態
            </h2>
          </div>
          <div className="space-y-2">
            {activeMadness.map((record) => (
              <Link
                key={record.id}
                href={`/characters/${record.character_id}/madness`}
                className="coc-madness-card flex items-center justify-between rounded-lg border px-4 py-3 transition-all motion-safe:hover:-translate-y-px"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-coc-text truncate">{record.symptom}</p>
                  <p className="text-xs text-coc-muted mt-0.5">
                    {record.characters?.name ?? "不明"} ·{" "}
                    <span
                      className={
                        record.madness_type === "indefinite" ? "text-red-400" : "text-yellow-500"
                      }
                    >
                      {record.madness_type === "indefinite" ? "不定の狂気" : "一時的狂気"}
                    </span>
                  </p>
                </div>
                <ChevronRight size={14} className="text-coc-faint flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
