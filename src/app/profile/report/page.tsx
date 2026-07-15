"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart2,
  Share2,
  CheckCircle,
  Trophy,
  Skull,
  Brain,
  Star,
  Clock,
} from "lucide-react";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";
import type { CharacterStatus, SuccessLevel } from "@/lib/supabase";

type CharSummary = {
  id: string;
  name: string;
  status: CharacterStatus;
  created_at: string;
};

type SessionLogSummary = {
  san_loss: number;
  hp_loss: number;
  played_at: string | null;
};

type DiceRollSummary = {
  skill_name: string;
  success_level: SuccessLevel;
};

type ReportData = {
  totalCharacters: number;
  aliveCount: number;
  deadCount: number;
  totalSessions: number;
  totalSanLoss: number;
  survivalRate: number;
  topSkill: string;
  longestSurvivingChar: string;
};

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-coc-border bg-coc-surface px-4 py-5 text-center flex flex-col items-center justify-center gap-1">
      <p className="text-xs text-coc-muted tracking-wide">{label}</p>
      <p className="text-4xl font-bold text-coc-gold tabular-nums">{value}</p>
      {sub && <p className="text-xs text-coc-faint">{sub}</p>}
    </div>
  );
}

export default function ProfileReportPage() {
  const searchParams = useSearchParams();
  const isPublicView = searchParams.get("public") === "true";
  const publicUid = searchParams.get("uid");

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ReportData | null>(null);
  const [copied, setCopied] = useState(false);
  const [playerName, setPlayerName] = useState<string>("プレイヤー");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    const supabase = createSupabaseBrowserClient();

    let userId: string | null = publicUid ?? null;

    if (!userId) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userId = user?.id ?? null;
    }

    if (!userId) {
      setLoading(false);
      return;
    }

    setCurrentUserId(userId);

    const { data: profileData } = await supabase
      .from("player_profiles")
      .select("display_name")
      .eq("user_id", userId)
      .maybeSingle();

    if (profileData?.display_name) {
      setPlayerName(profileData.display_name as string);
    }

    const { data: charsData } = await supabase
      .from("characters")
      .select("id, name, status, created_at")
      .eq("user_id", userId);

    const chars = (charsData ?? []) as CharSummary[];

    if (chars.length === 0) {
      setReport({
        totalCharacters: 0,
        aliveCount: 0,
        deadCount: 0,
        totalSessions: 0,
        totalSanLoss: 0,
        survivalRate: 0,
        topSkill: "—",
        longestSurvivingChar: "—",
      });
      setLoading(false);
      return;
    }

    const characterIds = chars.map((c) => c.id);

    const [{ data: logsData }, { data: diceData }] = await Promise.all([
      supabase
        .from("session_logs")
        .select("san_loss, hp_loss, played_at")
        .in("character_id", characterIds),
      supabase
        .from("dice_rolls")
        .select("skill_name, success_level")
        .in("character_id", characterIds),
    ]);

    const logs = (logsData ?? []) as SessionLogSummary[];
    const diceRolls = (diceData ?? []) as DiceRollSummary[];

    const aliveCount = chars.filter((c) => c.status === "alive").length;
    const deadCount = chars.filter((c) => c.status === "dead").length;
    const totalSanLoss = logs.reduce((sum, l) => sum + (l.san_loss ?? 0), 0);
    const survivalRate =
      chars.length > 0 ? Math.round((aliveCount / chars.length) * 100) : 0;

    const skillCounts: Record<string, number> = {};
    for (const roll of diceRolls) {
      if (roll.skill_name) {
        skillCounts[roll.skill_name] = (skillCounts[roll.skill_name] ?? 0) + 1;
      }
    }
    const topSkill =
      Object.entries(skillCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

    const aliveChars = chars.filter((c) => c.status === "alive");
    let longestSurvivingChar = "—";
    if (aliveChars.length > 0) {
      const oldest = [...aliveChars].sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )[0];
      longestSurvivingChar = oldest.name;
    }

    setReport({
      totalCharacters: chars.length,
      aliveCount,
      deadCount,
      totalSessions: logs.length,
      totalSanLoss,
      survivalRate,
      topSkill,
      longestSurvivingChar,
    });
    setLoading(false);
  }, [publicUid]);

  useEffect(() => {
    load();
  }, [load]);

  function handleShare() {
    const uid = currentUserId ?? "";
    const url = `${window.location.origin}/profile/report?public=true&uid=${uid}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  return (
    <div className="coc-page-enter mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/profile/edit"
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          プロフィールへ
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-coc-muted uppercase tracking-widest font-cinzel mb-1">
              Play Report Card
            </p>
            <h1 className="font-cinzel text-2xl font-bold text-coc-text flex items-center gap-2">
              <BarChart2 size={22} className="text-coc-gold" />
              {playerName} のプレイレポート
            </h1>
          </div>
          {!isPublicView && (
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-xs text-coc-muted hover:text-coc-text hover:border-coc-gold-dim transition-colors shrink-0"
            >
              {copied ? (
                <>
                  <CheckCircle size={13} className="text-green-400" />
                  コピー済み
                </>
              ) : (
                <>
                  <Share2 size={13} />
                  シェアする
                </>
              )}
            </button>
          )}
        </div>
        {isPublicView && (
          <p className="mt-2 text-xs text-coc-muted italic">
            ※ このページは共有リンクで閲覧中です
          </p>
        )}
      </div>

      {!isSupabaseConfigured && (
        <div className="rounded-lg border border-coc-border bg-coc-surface p-6 text-center text-coc-muted text-sm">
          Supabase が未設定のため、データを読み込めません。
        </div>
      )}

      {isSupabaseConfigured && loading && (
        <p className="text-center text-coc-muted text-sm italic font-crimson py-12">
          集計中...
        </p>
      )}

      {isSupabaseConfigured && !loading && !report && (
        <div className="rounded-lg border border-coc-border bg-coc-surface p-8 text-center">
          <p className="text-coc-muted text-sm mb-3">
            ログインが必要です。または対象のプレイヤーデータが見つかりません。
          </p>
          <Link href="/login" className="text-xs text-coc-gold hover:underline">
            ログインする →
          </Link>
        </div>
      )}

      {report && (
        <div className="space-y-6">
          {/* Main stats grid */}
          <section>
            <h2 className="font-cinzel text-xs font-semibold text-coc-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Trophy size={13} className="text-coc-gold" />
              探索実績
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <StatCard label="総キャラクター数" value={report.totalCharacters} />
              <StatCard label="総セッション数" value={report.totalSessions} />
              <StatCard
                label="生存率"
                value={`${report.survivalRate}%`}
                sub={`${report.aliveCount} / ${report.totalCharacters} 人生存`}
              />
            </div>
          </section>

          {/* San & danger stats */}
          <section>
            <h2 className="font-cinzel text-xs font-semibold text-coc-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Brain size={13} className="text-purple-400" />
              正気度・危険度
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="累計SAN喪失量" value={report.totalSanLoss} />
              <StatCard label="死亡キャラクター数" value={report.deadCount} />
            </div>
          </section>

          {/* Skill & highlight */}
          <section>
            <h2 className="font-cinzel text-xs font-semibold text-coc-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Star size={13} className="text-coc-gold" />
              プレイスタイル
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-coc-border bg-coc-surface px-4 py-5">
                <p className="text-xs text-coc-muted mb-2">最多使用スキル</p>
                <p className="text-2xl font-bold text-coc-gold">{report.topSkill}</p>
              </div>
              <div className="rounded-xl border border-coc-border bg-coc-surface px-4 py-5">
                <p className="text-xs text-coc-muted mb-2 flex items-center gap-1">
                  <Clock size={11} />
                  最長生存キャラクター
                </p>
                <p className="text-lg font-bold text-coc-text truncate">
                  {report.longestSurvivingChar}
                </p>
              </div>
            </div>
          </section>

          {/* Death notice */}
          {report.deadCount > 0 && (
            <div className="rounded-lg border border-red-900/40 bg-red-950/20 px-4 py-3 flex items-center gap-3">
              <Skull size={16} className="text-red-400 shrink-0" />
              <p className="text-sm text-red-300">
                これまでに{" "}
                <span className="font-bold">{report.deadCount} 人</span>{" "}
                の探索者が命を落とした。
              </p>
            </div>
          )}

          {/* Bottom share button */}
          {!isPublicView && (
            <div className="pt-2 flex justify-center">
              <button
                onClick={handleShare}
                className="flex items-center gap-2 rounded-lg border border-coc-gold bg-coc-gold/10 px-5 py-3 text-sm text-coc-gold hover:bg-coc-gold/20 transition-colors"
              >
                {copied ? (
                  <>
                    <CheckCircle size={15} />
                    URLをコピーしました
                  </>
                ) : (
                  <>
                    <Share2 size={15} />
                    このレポートをシェアする
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
