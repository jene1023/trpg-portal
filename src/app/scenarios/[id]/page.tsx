export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import { ArrowLeft, Users, FileText, User, Shield, StickyNote, Swords, CalendarClock, ShieldCheck, ClipboardList, BarChart2, MapPin, Vote, Bug, Music, ListChecks, Star, Clock, ExternalLink, UserCheck, Monitor, Radio, Skull, Package, Dices, MessageSquare, BookOpen, HelpCircle, TimerIcon, PlayCircle, TrendingUp, PenLine, Film, Trophy, AlertTriangle, MessageSquarePlus, ShieldAlert, UserPlus, Search, GitBranch, Gauge, Download, Library, ScrollText, Archive, UserMinus, CheckSquare, Users2, Megaphone, Activity, Share2, RefreshCw, Target, BookMarked, ClipboardCheck, Heart, Sparkles, Network } from "lucide-react";
import { supabase, isSupabaseConfigured, ScenarioStatus, ScenarioDifficulty, ScenarioPlaytimeType, AttendanceStatus } from "@/lib/supabase";
import ScenarioDuplicateButton from "@/app/_components/ScenarioDuplicateButton";
import SessionPackShareButton from "@/app/_components/SessionPackShareButton";
import RecruitShareButton from "@/app/_components/RecruitShareButton";
import ScenarioDiscordWebhookEditor from "@/app/_components/ScenarioDiscordWebhookEditor";
import ScenarioReminderEditor from "@/app/_components/ScenarioReminderEditor";
import AddToCampaignButton from "@/app/_components/AddToCampaignButton";
import ScenarioExportButton from "@/app/_components/ScenarioExportButton";
import ScenarioPrintButton from "@/app/_components/ScenarioPrintButton";
import ScenarioZipDownloadButton from "@/app/_components/ScenarioZipDownloadButton";
import KpMemoSection from "@/app/_components/KpMemoSection";
import TagSelector from "@/app/_components/TagSelector";
import ScenarioDifficultyEvaluator from "@/app/_components/ScenarioDifficultyEvaluator";
import GameClockEditor from "@/app/_components/GameClockEditor";
import NextEpisodePreviewGenerator from "@/app/_components/NextEpisodePreviewGenerator";
import ScenarioTemplateToggle from "@/app/_components/ScenarioTemplateToggle";
import TeaserEditor from "@/app/_components/TeaserEditor";
import SaveAsTemplateButton from "@/app/_components/SaveAsTemplateButton";
import RecruitBoardPublishToggle from "@/app/_components/RecruitBoardPublishToggle";

const STATUS_LABELS: Record<ScenarioStatus, string> = {
  planning: "準備中",
  ongoing: "進行中",
  completed: "完了",
};

const STATUS_COLORS: Record<ScenarioStatus, string> = {
  planning: "text-coc-muted border-coc-border",
  ongoing: "text-coc-gold border-coc-gold-dim",
  completed: "text-green-400 border-green-800",
};

const DIFFICULTY_LABELS: Record<ScenarioDifficulty, string> = {
  beginner: "初心者向け",
  intermediate: "中級",
  advanced: "上級",
};

const DIFFICULTY_COLORS: Record<ScenarioDifficulty, string> = {
  beginner: "text-green-400 border-green-800",
  intermediate: "text-yellow-400 border-yellow-800",
  advanced: "text-red-400 border-red-800",
};

const PLAYTIME_LABELS: Record<ScenarioPlaytimeType, string> = {
  short: "短編（〜3時間）",
  medium: "中編（3〜6時間）",
  long: "長編（6時間〜）",
};

type Props = { params: Promise<{ id: string }> };

export default async function ScenarioDetailPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const webcalScenarioUrl = `webcal://${host}/api/calendar/scenario/${id}`;

  const { data: scenario } = await supabase
    .from("scenarios")
    .select("*")
    .eq("id", id)
    .single();

  if (!scenario) notFound();

  const [
    { count: handoutCount },
    { data: participantRows },
    { count: npcCount },
    { count: creatureCount },
    { data: ratingRows },
    { data: propRows },
    { count: pendingThreadCount },
    { data: sessionReviewRows },
    { count: feedbackCount },
    { data: safetySettings },
    { count: scheduleProposalCount },
    { data: objectiveRows },
    { data: participantReviewRows },
  ] = await Promise.all([
    supabase.from("handouts").select("*", { count: "exact", head: true }).eq("scenario_id", id),
    supabase.from("scenario_participants").select("id, attendance_status, hook_text").eq("scenario_id", id),
    supabase.from("npcs").select("*", { count: "exact", head: true }).eq("scenario_name", scenario.title),
    supabase.from("creatures").select("*", { count: "exact", head: true }).eq("scenario_id", id),
    supabase.from("scenario_player_ratings").select("fun_rating, horror_rating, mystery_rating, character_rating").eq("scenario_id", id),
    supabase.from("scenario_props").select("id, is_distributed").eq("scenario_id", id),
    supabase.from("plot_threads").select("*", { count: "exact", head: true }).eq("scenario_id", id).eq("status", "pending"),
    supabase.from("session_reviews").select("fun_score, tension_score").eq("scenario_id", id),
    supabase.from("player_feedback").select("*", { count: "exact", head: true }).eq("scenario_id", id),
    supabase.from("scenario_safety_settings").select("x_card_enabled").eq("scenario_id", id).single(),
    supabase.from("schedule_proposals").select("*", { count: "exact", head: true }).eq("scenario_id", id),
    supabase.from("scenario_objectives").select("is_achieved").eq("scenario_id", id),
    supabase.from("scenario_participant_reviews").select("rating").eq("scenario_id", id),
  ]);

  const objectiveTotal = objectiveRows?.length ?? 0;
  const objectiveAchieved = objectiveRows?.filter((o) => o.is_achieved).length ?? 0;

  const safetyConfigured = safetySettings !== null;
  const xCardEnabled = safetySettings?.x_card_enabled ?? false;

  const sessionReviewCount = sessionReviewRows?.length ?? 0;
  const avgSessionFun = sessionReviewCount > 0 ? (sessionReviewRows!.reduce((s, r) => s + r.fun_score, 0) / sessionReviewCount) : null;
  const avgSessionTension = sessionReviewCount > 0 ? (sessionReviewRows!.reduce((s, r) => s + r.tension_score, 0) / sessionReviewCount) : null;

  const propCount = propRows?.length ?? 0;
  const undistributedPropCount = propRows?.filter((p) => !p.is_distributed).length ?? 0;

  const ratingCount = ratingRows?.length ?? 0;
  const avgFun = ratingCount > 0 ? (ratingRows!.reduce((s, r) => s + r.fun_rating, 0) / ratingCount) : null;
  const avgHorror = ratingCount > 0 ? (ratingRows!.reduce((s, r) => s + r.horror_rating, 0) / ratingCount) : null;
  const avgMystery = ratingCount > 0 ? (ratingRows!.reduce((s, r) => s + r.mystery_rating, 0) / ratingCount) : null;
  const avgCharacter = ratingCount > 0 ? (ratingRows!.reduce((s, r) => s + r.character_rating, 0) / ratingCount) : null;

  const participantReviewCount = participantReviewRows?.length ?? 0;
  const avgParticipantRating =
    participantReviewCount > 0
      ? participantReviewRows!.reduce((s, r) => s + (r.rating as number), 0) / participantReviewCount
      : null;

  const participantCount = participantRows?.length ?? 0;
  const attendingCount = participantRows?.filter((p) => (p.attendance_status as AttendanceStatus) === "attending").length ?? 0;
  const absentCount = participantRows?.filter((p) => (p.attendance_status as AttendanceStatus) === "absent").length ?? 0;
  const unconfirmedCount = participantCount - attendingCount - absentCount;
  const hookSetCount = participantRows?.filter((p) => p.hook_text).length ?? 0;

  return (
    <div className="coc-page-enter mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between gap-3 mb-6">
        <Link
          href="/scenarios"
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          シナリオ一覧
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/scenarios/${id}/ops`}
            className="flex items-center gap-1.5 rounded-lg border border-coc-gold bg-coc-gold/10 px-3 py-1.5 text-sm font-medium text-coc-gold hover:bg-coc-gold/20 transition-colors"
          >
            <PlayCircle size={15} />
            セッション開始
          </Link>
          <ScenarioPrintButton scenarioId={id} />
          <ScenarioExportButton scenarioId={id} scenarioTitle={scenario.title} />
          <ScenarioZipDownloadButton scenarioId={id} scenarioTitle={scenario.title} />
          <AddToCampaignButton scenarioId={id} />
          <ScenarioDuplicateButton scenarioId={id} />
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <h1 className="font-cinzel text-2xl font-bold text-coc-text">
            {scenario.title}
          </h1>
          <span
            className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[scenario.status as ScenarioStatus]}`}
          >
            {STATUS_LABELS[scenario.status as ScenarioStatus]}
          </span>
          {avgParticipantRating !== null && (
            <Link
              href={`/scenarios/${id}/reviews`}
              className="flex items-center gap-1 rounded-full border border-coc-gold-dim bg-coc-gold/10 px-2.5 py-0.5 text-xs font-medium text-coc-gold hover:bg-coc-gold/20 transition-colors"
            >
              <Star size={11} fill="currentColor" />
              {avgParticipantRating.toFixed(1)}
              <span className="text-coc-muted font-normal">（{participantReviewCount}件）</span>
            </Link>
          )}
        </div>
        {scenario.played_at && (
          <p className="text-xs text-coc-muted">プレイ日: {scenario.played_at}</p>
        )}
        {scenario.next_session_at && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 rounded-full border border-coc-gold-dim bg-coc-raised px-3 py-1 text-xs font-medium text-coc-gold">
              <CalendarClock size={13} />
              次回セッション予定:{" "}
              {new Date(scenario.next_session_at).toLocaleString("ja-JP", {
                year: "numeric",
                month: "numeric",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
            <a
              href={`/api/calendar/scenario/${id}`}
              download="trpg-session.ics"
              className="flex items-center gap-1 rounded-full border border-coc-border px-2.5 py-1 text-xs text-coc-muted hover:text-coc-text hover:border-coc-gold transition-colors"
            >
              <Download size={11} />
              .ics
            </a>
            <a
              href={webcalScenarioUrl}
              className="flex items-center gap-1 rounded-full border border-coc-border px-2.5 py-1 text-xs text-coc-muted hover:text-coc-text hover:border-coc-gold transition-colors"
            >
              <CalendarClock size={11} />
              カレンダーに追加
            </a>
          </div>
        )}
        <div className="mt-3">
          <GameClockEditor
            scenarioId={id}
            initialDate={scenario.game_current_date ?? null}
            initialTime={scenario.game_current_time ?? null}
          />
        </div>

        {scenario.vtt_url && (
          <div className="mt-3">
            <a
              href={scenario.vtt_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-coc-gold bg-coc-gold/10 px-3 py-1 text-xs font-semibold text-coc-gold hover:bg-coc-gold/20 transition-colors"
            >
              <ExternalLink size={13} />
              {scenario.vtt_type ? `${scenario.vtt_type}で卓に入る` : "卓に入る"}
            </a>
          </div>
        )}

        {/* メタ情報バッジ */}
        {(scenario.difficulty || scenario.playtime_type || scenario.min_players != null || scenario.max_players != null) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {scenario.difficulty && (
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${DIFFICULTY_COLORS[scenario.difficulty as ScenarioDifficulty]}`}>
                {DIFFICULTY_LABELS[scenario.difficulty as ScenarioDifficulty]}
              </span>
            )}
            {scenario.playtime_type && (
              <span className="rounded-full border border-coc-border px-2.5 py-0.5 text-xs text-coc-muted">
                {PLAYTIME_LABELS[scenario.playtime_type as ScenarioPlaytimeType]}
              </span>
            )}
            {(scenario.min_players != null || scenario.max_players != null) && (
              <span className="rounded-full border border-coc-border px-2.5 py-0.5 text-xs text-coc-muted">
                推奨{" "}
                {scenario.min_players != null && scenario.max_players != null
                  ? `${scenario.min_players}〜${scenario.max_players}人`
                  : scenario.min_players != null
                  ? `${scenario.min_players}人〜`
                  : `〜${scenario.max_players}人`}
              </span>
            )}
          </div>
        )}

        {/* コンテンツ警告タグ */}
        {(scenario.content_tags ?? []).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="text-xs text-coc-muted self-center">注意:</span>
            {(scenario.content_tags ?? []).map((tag: string) => (
              <span
                key={tag}
                className="rounded-full border border-red-900 bg-red-950/30 px-2.5 py-0.5 text-xs text-red-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {unconfirmedCount > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-yellow-800 bg-yellow-950/20 px-4 py-3">
          <AlertTriangle size={15} className="text-yellow-400 flex-shrink-0" />
          <p className="text-sm text-yellow-300">
            出欠未確認の参加者が <span className="font-bold">{unconfirmedCount}名</span> います
          </p>
          <a
            href={`/scenarios/${id}/participants`}
            className="ml-auto text-xs text-yellow-400 hover:underline flex-shrink-0"
          >
            確認する →
          </a>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-6 sm:grid-cols-4">
        <div className="rounded-xl border border-coc-border bg-coc-surface px-4 py-3 text-center">
          <p className="text-2xl font-bold text-coc-text">{participantCount}</p>
          <p className="text-xs text-coc-muted mt-1">参加者</p>
          {participantCount > 0 && (
            <p className="text-xs mt-1 leading-tight">
              <span className="text-green-400">{attendingCount}参加</span>
              {" / "}
              <span className="text-red-400">{absentCount}欠席</span>
              {unconfirmedCount > 0 && (
                <span className="text-coc-muted"> / {unconfirmedCount}未定</span>
              )}
            </p>
          )}
        </div>
        <div className="rounded-xl border border-coc-border bg-coc-surface px-4 py-3 text-center">
          <p className="text-2xl font-bold text-coc-text">{handoutCount ?? 0}</p>
          <p className="text-xs text-coc-muted mt-1">ハンドアウト</p>
        </div>
        <div className="rounded-xl border border-coc-border bg-coc-surface px-4 py-3 text-center">
          <p className="text-2xl font-bold text-coc-text">{npcCount ?? 0}</p>
          <p className="text-xs text-coc-muted mt-1">NPC</p>
        </div>
        <div className="rounded-xl border border-coc-border bg-coc-surface px-4 py-3 text-center">
          <p className="text-2xl font-bold text-coc-text">{creatureCount ?? 0}</p>
          <p className="text-xs text-coc-muted mt-1">クリーチャー</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 mb-6">
        <Link
          href={`/scenarios/${id}/participants`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <Users size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">参加キャラクター</p>
              <p className="text-xs text-coc-muted">PLキャラクターの登録・確認</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hookSetCount > 0 && (
              <span className="rounded-full bg-coc-gold/20 px-2 py-0.5 text-xs font-medium text-coc-gold">
                フック {hookSetCount}件
              </span>
            )}
            <span className="text-coc-muted">→</span>
          </div>
        </Link>

        <Link
          href={`/scenarios/${id}/absences`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <UserMinus size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">欠席者記録</p>
              <p className="text-xs text-coc-muted">欠席キャラクターの在処・代理行動・復帰条件をKPが記録</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/wishes`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <Heart size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">PLの期待リスト</p>
              <p className="text-xs text-coc-muted">次セッションへの期待・行きたい場所・再会したいNPCをPLが投稿</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/session-zero`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <Users2 size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">Session 0</p>
              <p className="text-xs text-coc-muted">PC関係構築と世界観合意フォーム（キャンペーン開始前）</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/introductions`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <UserCheck size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">キャラクター自己紹介</p>
              <p className="text-xs text-coc-muted">セッション前に動機・秘密の目標を共有</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/introduction`}
          className="flex items-center justify-between rounded-xl border border-coc-gold-dim bg-coc-raised px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <BookOpen size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-gold">📢 イントロ配信</p>
              <p className="text-xs text-coc-muted">KPがオープニングナレーション・コンテンツ警告をワンクリックで全PL画面に配信</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/checkin`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <ShieldCheck size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">チェックイン</p>
              <p className="text-xs text-coc-muted">セッション前に参加者のコンディション（体力・気分）を確認</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/handouts`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <FileText size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">ハンドアウト</p>
              <p className="text-xs text-coc-muted">情報カードの作成・管理</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/clues`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <Search size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">手がかり管理</p>
              <p className="text-xs text-coc-muted">発見した手がかりの調査・解決状況を管理</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/clue-board`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <Network size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">🕵️ 手がかりボード</p>
              <p className="text-xs text-coc-muted">手がかり・NPC・ロケーションをノードでつなぐ探偵ボード</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/party`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <Shield size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">パーティービュー</p>
              <p className="text-xs text-coc-muted">参加者全員のHP/MP/SANを一覧確認</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/party-status`}
          className="flex items-center justify-between rounded-xl border border-coc-gold-dim bg-coc-raised px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <Activity size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-gold">パーティ状態モニター</p>
              <p className="text-xs text-coc-muted">HP/SAN/MPをカラーバーでリアルタイム監視 — KPのペース調整・SAN喪失タイミング判断に</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/party-balance`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <BarChart2 size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">能力値バランス</p>
              <p className="text-xs text-coc-muted">STR/CON/POW/DEX/INT/EDUを横並び比較してセッション前の編成確認に</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/party-skills`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <BarChart2 size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">スキル分析</p>
              <p className="text-xs text-coc-muted">パーティの技能カバレッジを確認・誰もカバーしていない技能を⚠️で強調</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/party-stats`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <ListChecks size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">能力値比較テーブル</p>
              <p className="text-xs text-coc-muted">STR/CON/POW/DEX/APP/SIZ/INT/EDUを全員横並びで比較</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/combat`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <Swords size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">⚔️ 戦闘トラッカー</p>
              <p className="text-xs text-coc-muted">DEX順イニシアチブ・HP/MP管理・コンディションバッジ・リアルタイム同期</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/locations`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <MapPin size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">🗺️ ロケーション</p>
              <p className="text-xs text-coc-muted">探索地点の手がかり・NPC・危険度を管理・PL公開トグル付き</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/enemy-tracker`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <Skull size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">戦闘トラッカー</p>
              <p className="text-xs text-coc-muted">敵HPをリアルタイムで追跡・管理</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/initiative`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <Activity size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">イニシアティブトラッカー</p>
              <p className="text-xs text-coc-muted">行動順をリアルタイム同期 — ラウンドカウンター・全員への即時反映</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/chat`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <MessageSquare size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">チャット</p>
              <p className="text-xs text-coc-muted">参加者間のリアルタイムテキストチャット（OOCコメント・セッション中の会話）</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/poll`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <Vote size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">行動投票</p>
              <p className="text-xs text-coc-muted">KPが議題を立て参加PLがリアルタイムで行動を多数決・全員に即時共有</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/broadcast`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <Megaphone size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">KP通知送信</p>
              <p className="text-xs text-coc-muted">参加者全員へOOC通知を一斉送信（既読管理付き・永続保存）</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/roll-feed`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <Radio size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">ロールフィード</p>
              <p className="text-xs text-coc-muted">参加者のダイス結果をリアルタイムでブロードキャスト</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/dice-feed`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <Dices size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">ダイスフィード</p>
              <p className="text-xs text-coc-muted">参加者のロール履歴をリアルタイムで受信（DB 監視）</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/notes`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <StickyNote size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">共有メモ</p>
              <p className="text-xs text-coc-muted">手がかり・決定事項をパーティーで共有</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/npcs`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <User size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">
                NPC管理
                {(npcCount ?? 0) > 0 && (
                  <span className="ml-2 text-xs font-normal text-coc-muted">({npcCount}件)</span>
                )}
              </p>
              <p className="text-xs text-coc-muted">このシナリオのNPCを一覧・追加・管理</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/npc-map`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <GitBranch size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">NPC相関マップ</p>
              <p className="text-xs text-coc-muted">陣営別にNPCの関係を俯瞰できるビジュアルマップ</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/relation-map`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <Share2 size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">関係マップ</p>
              <p className="text-xs text-coc-muted">PC・NPC間の人間関係をノード＆エッジのビジュアルグラフで俯瞰</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/safety`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <ShieldAlert size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">
                安全設定
                {safetyConfigured && (
                  <span className="ml-2 text-xs text-green-400 font-normal">
                    {xCardEnabled ? "X-Card 有効" : "設定済み"}
                  </span>
                )}
              </p>
              <p className="text-xs text-coc-muted">X-Card・ライン＆ヴェールでセッションの安全を守る</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/preflight`}
          className="flex items-center justify-between rounded-xl border border-coc-gold-dim bg-coc-raised px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <ShieldCheck size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-gold">セッション準備確認</p>
              <p className="text-xs text-coc-muted">NPC・ハンドアウト・参加者の準備状況を一括チェック</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/kp-preflight`}
          className="flex items-center justify-between rounded-xl border border-coc-gold-dim bg-coc-raised px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <ClipboardList size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-gold">KP準備確認</p>
              <p className="text-xs text-coc-muted">ハンドアウト配布・BGMキュー・シーンリスト・出欠をセッション当日に一括点検</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/session-prep`}
          className="flex items-center justify-between rounded-xl border border-coc-gold-dim bg-coc-raised px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <UserCheck size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-gold">セッション準備</p>
              <p className="text-xs text-coc-muted">出欠確認・フック配布・HP/SANを一括管理</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/prep`}
          className="flex items-center justify-between rounded-xl border border-coc-gold-dim bg-coc-raised px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <CheckSquare size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-gold">準備チェックリスト</p>
              <p className="text-xs text-coc-muted">セッション前の準備タスクをカスタム登録・テンプレート再利用</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/objectives`}
          className="flex items-center justify-between rounded-xl border border-coc-gold-dim bg-coc-raised px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <Target size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-gold">
                目標トラッカー
                {objectiveTotal > 0 && (
                  <span className="ml-2 text-xs font-normal text-coc-muted">
                    {objectiveAchieved}/{objectiveTotal}達成
                  </span>
                )}
              </p>
              <p className="text-xs text-coc-muted">メイン・サブ目標をリスト化し達成率をプログレスバーで可視化</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/gm-screen`}
          className="flex items-center justify-between rounded-xl border border-coc-gold-dim bg-coc-raised px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <Monitor size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-gold">GMスクリーン</p>
              <p className="text-xs text-coc-muted">NPC・クリーチャー・パーティー・ハンドアウトをセッション中に一画面で確認</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/live`}
          className="flex items-center justify-between rounded-xl border border-coc-gold-dim bg-coc-raised px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <Radio size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-gold">ライブ進行</p>
              <p className="text-xs text-coc-muted">参加者全員のHP/SAN/MPをリアルタイムで一覧・即時更新（KP用コントロールパネル）</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/end-sync`}
          className="flex items-center justify-between rounded-xl border border-coc-gold-dim bg-coc-raised px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <RefreshCw size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-gold">セッション終了・値を確定</p>
              <p className="text-xs text-coc-muted">VTT上で変動したHP・SAN・幸運を一括反映</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/retrospective`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <ClipboardList size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">振り返りノート</p>
              <p className="text-xs text-coc-muted">うまくいったこと・改善点・PLの反応を記録</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/kp-debrief`}
          className="flex items-center justify-between rounded-xl border border-coc-gold-dim bg-coc-raised px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <Sparkles size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-gold">AIデブリーフ</p>
              <p className="text-xs text-coc-muted">セッションデータをAIが分析してKP向けの改善提案・振り返りレポートを生成</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        {scenario.status === "completed" && (
          <Link
            href={`/scenarios/${id}/review`}
            className="flex items-center justify-between rounded-xl border border-coc-gold-dim bg-coc-raised px-5 py-4 hover:border-coc-gold transition-colors"
          >
            <div className="flex items-center gap-3">
              <Star size={20} className="text-coc-gold" />
              <div>
                <p className="font-medium text-coc-gold">KP振り返りレポート</p>
                <p className="text-xs text-coc-muted">5段階評価・感想・改善点をKP成長ログとして記録</p>
              </div>
            </div>
            <span className="text-coc-muted">→</span>
          </Link>
        )}

        {scenario.status === "completed" && (
          <Link
            href={`/scenarios/${id}/epilogue`}
            className="flex items-center justify-between rounded-xl border border-coc-gold-dim bg-coc-raised px-5 py-4 hover:border-coc-gold transition-colors"
          >
            <div className="flex items-center gap-3">
              <ScrollText size={20} className="text-coc-gold" />
              <div>
                <p className="font-medium text-coc-gold">エピローグを記録</p>
                <p className="text-xs text-coc-muted">シナリオの物語的結末と各探索者のエンディングを残す</p>
              </div>
            </div>
            <span className="text-coc-muted">→</span>
          </Link>
        )}

        <Link
          href={`/scenarios/${id}/session-review`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <PenLine size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">卓振り返り</p>
              <p className="text-xs text-coc-muted">
                {sessionReviewCount > 0
                  ? `${sessionReviewCount}件 楽しさ${avgSessionFun!.toFixed(1)} / 緊張感${avgSessionTension!.toFixed(1)}`
                  : "楽しさ・緊張感・印象的な場面を記録"}
              </p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/reflections`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <MessageSquare size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">合同振り返り</p>
              <p className="text-xs text-coc-muted">KP・PL双方がセッションの感想・改善提案を自由投稿</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/highlights`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <Star size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">ハイライト投票</p>
              <p className="text-xs text-coc-muted">印象的なシーンをカテゴリ別に記録していいねで盛り上がれる</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/feedback`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <MessageSquarePlus size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">
                PLフィードバック
                {(feedbackCount ?? 0) > 0 && (
                  <span className="ml-2 text-xs font-normal text-coc-muted">({feedbackCount}件)</span>
                )}
              </p>
              <p className="text-xs text-coc-muted">セッション後の感想・改善提案をPLから匿名収集</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/feedback-summary`}
          className="flex items-center justify-between rounded-xl border border-coc-gold-dim bg-coc-raised px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <BarChart2 size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-gold">フィードバック総括</p>
              <p className="text-xs text-coc-muted">感想投票・合同振り返り・PLフィードバックを1画面で俯瞰</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/survey/results`}
          className="flex items-center justify-between rounded-xl border border-coc-gold-dim bg-coc-raised px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <ClipboardCheck size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-gold">事後アンケートを開始</p>
              <p className="text-xs text-coc-muted">MVP投票・名場面共有・次回期待度を匿名で収集（KP集計）</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/damage-summary`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <BarChart2 size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">喪失サマリー</p>
              <p className="text-xs text-coc-muted">セッション別・参加者別のSAN/HP喪失量を俯瞰</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/dice-stats`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <TrendingUp size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">判定統計</p>
              <p className="text-xs text-coc-muted">参加者別の成功率・ファンブル率・最多使用技能を一覧</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/scoreboard`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <Trophy size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">スコアボード</p>
              <p className="text-xs text-coc-muted">最多ファンブル・最多クリティカル・最高成功率・総判定数のランキング</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/areas`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <MapPin size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">エリアメモ</p>
              <p className="text-xs text-coc-muted">地点・場所ごとの説明とGMメモを管理</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/schedule`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <Vote size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">日程調整</p>
              <p className="text-xs text-coc-muted">候補日程の投票・集計・次回予定の確定</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(scheduleProposalCount ?? 0) > 0 && (
              <span className="rounded-full bg-coc-gold/20 px-2 py-0.5 text-xs font-medium text-coc-gold">
                投票受付中
              </span>
            )}
            <span className="text-coc-muted">→</span>
          </div>
        </Link>

        <Link
          href={`/scenarios/${id}/schedule-poll`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <CalendarClock size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">日程調整（投票）</p>
              <p className="text-xs text-coc-muted">KPが候補日を提示しPLが○△×で回答するDoodle風スケジュール調整</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/creatures`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <Bug size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">
                クリーチャー図鑑
                {(creatureCount ?? 0) > 0 && (
                  <span className="ml-2 text-xs font-normal text-coc-muted">({creatureCount}体)</span>
                )}
              </p>
              <p className="text-xs text-coc-muted">このシナリオに登場する神話的クリーチャーの能力値・恐怖度・秘匿情報を管理</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/bgm`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <Music size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">BGM・演出</p>
              <p className="text-xs text-coc-muted">場面別BGMリンクと演出メモを管理</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/bgm-player`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <Radio size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">BGMプレイヤー</p>
              <p className="text-xs text-coc-muted">KPのBGM切り替えを全参加者へリアルタイム通知・YouTube埋め込み再生</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/materials`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <Library size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">素材ライブラリ</p>
              <p className="text-xs text-coc-muted">BGM・マップ・参考画像リンクをタグ付きで管理</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/scene-board`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <GitBranch size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">シーンボード</p>
              <p className="text-xs text-coc-muted">カンバン形式でシーンをフェーズ別に管理（オープニング→調査→クライマックス→エンディング）</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/agenda`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <ListChecks size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">セッションアジェンダ</p>
              <p className="text-xs text-coc-muted">進行チェックリスト・場面プランナーでセッションを管理</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/ratings`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <Star size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">感想投票</p>
              <p className="text-xs text-coc-muted">
                {ratingCount > 0
                  ? `${ratingCount}件の評価 ★${((avgFun! + avgHorror! + avgMystery! + avgCharacter!) / 4).toFixed(1)}`
                  : "楽しさ・恐怖演出・謎解き・キャラ活躍度を4軸評価"}
              </p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/reviews`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <Star size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">シナリオレビュー</p>
              <p className="text-xs text-coc-muted">
                {participantReviewCount > 0
                  ? `${participantReviewCount}件 ★${avgParticipantRating!.toFixed(1)} — 参加者の星評価＆感想`
                  : "セッション後に参加者が星1〜5で評価・感想投稿"}
              </p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/truth-timeline`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <Clock size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">真相タイムライン</p>
              <p className="text-xs text-coc-muted">事件経緯をKP専用の時系列ノートで整理</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/props`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <Package size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">
                物証・道具
                {propCount > 0 && (
                  <span className="ml-2 text-xs text-coc-muted">({propCount}件</span>
                )}
                {undistributedPropCount > 0 && (
                  <span className="ml-0.5 text-xs text-yellow-400"> / 未配布 {undistributedPropCount}件</span>
                )}
                {propCount > 0 && (
                  <span className="text-xs text-coc-muted">)</span>
                )}
              </p>
              <p className="text-xs text-coc-muted">シナリオ中の物証・証拠品・プロップを管理</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/shared-inventory`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <Archive size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">共有装備BOX</p>
              <p className="text-xs text-coc-muted">パーティー全員で共有できるアイテムストレージ</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/party-inventory`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <Package size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">共有アイテム庫</p>
              <p className="text-xs text-coc-muted">鍵・地図・共用武器などパーティー共有アイテムを所持者割り当てで管理</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/difficulty`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <Gauge size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">難易度チェック</p>
              <p className="text-xs text-coc-muted">クリーチャーvsパーティーの脅威度を比較して難易度を推定</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/random-events`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <Dices size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">ランダムイベント</p>
              <p className="text-xs text-coc-muted">重み付き抽選でセッションに偶発的展開を追加</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/custom-tables`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <Dices size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">ランダム表</p>
              <p className="text-xs text-coc-muted">KP独自の遭遇表・症状表をd4〜d20で作成・セッション中にロール</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/group-roll`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <Dices size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">グループロール</p>
              <p className="text-xs text-coc-muted">参加者全員に同一の技能判定を一括実行</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href="/players"
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <UserCheck size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">プレイヤー管理</p>
              <p className="text-xs text-coc-muted">卓メンバーの連絡先・好みのシナリオ傾向を管理</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/plot-threads`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <HelpCircle size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">
                謎・伏線管理
                {(pendingThreadCount ?? 0) > 0 && (
                  <span className="ml-2 text-xs font-semibold text-yellow-400">
                    未解明: {pendingThreadCount}件
                  </span>
                )}
              </p>
              <p className="text-xs text-coc-muted">シナリオ内の謎・伏線・秘密をステータスで追跡</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/pacing`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <TimerIcon size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">ペーシングログ</p>
              <p className="text-xs text-coc-muted">シーン別の経過時間を記録してセッション時間管理に活用</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/timer`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <TimerIcon size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">タイマー</p>
              <p className="text-xs text-coc-muted">シーン制限カウントダウン（全員リアルタイム同期）＋セッション経過ストップウォッチ</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/replay`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <Film size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">リプレイ</p>
              <p className="text-xs text-coc-muted">全参加者のセッションログとクリティカル・ファンブルを時系列で振り返る</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/recap`}
          className="flex items-center justify-between rounded-xl border border-coc-gold-dim bg-coc-raised px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <BookOpen size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-gold">リプレイ記事を生成</p>
              <p className="text-xs text-coc-muted">セッションログ・共有メモ・登場NPCを集約してマークダウンでコピー</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/scenarios/${id}/previously`}
          className="flex items-center justify-between rounded-xl border border-coc-gold-dim bg-coc-raised px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <Sparkles size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-gold">前回のあらすじ生成</p>
              <p className="text-xs text-coc-muted">セッションログ・解決済み手がかり・プロットをもとにAIがドラマチックなナレーションを生成</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <UserPlus size={20} className="text-coc-gold" />
              <div>
                <p className="font-medium text-coc-text">参加者募集ページ</p>
                <p className="text-xs text-coc-muted">タイトル・あらすじ・難易度・日程を公開して参加者を募集</p>
              </div>
            </div>
            <RecruitShareButton scenarioId={id} />
          </div>
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-coc-border">
            <RecruitBoardPublishToggle
              scenarioId={id}
              initialIsPublic={scenario.teaser_is_public ?? false}
            />
            <Link
              href="/scenarios/recruit-board"
              className="text-xs text-coc-muted hover:text-coc-gold transition-colors"
            >
              公募掲示板を見る →
            </Link>
          </div>
        </div>

        <Link
          href={`/scenarios/${id}/invite`}
          className="flex items-center justify-between gap-3 rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold-dim transition-colors"
        >
          <div className="flex items-center gap-3">
            <Share2 size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">参加招待コード</p>
              <p className="text-xs text-coc-muted">PLがURLまたはQRコードから直接キャラクターを選んで参加申請できる招待リンクを発行</p>
            </div>
          </div>
          <span className="text-coc-muted">→</span>
        </Link>

        <div className="rounded-xl border border-coc-gold-dim bg-coc-raised px-5 py-4">
          <div className="flex items-center gap-3 mb-3">
            <Radio size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-gold">情報パックをPLと共有</p>
              <p className="text-xs text-coc-muted">
                シナリオ概要・参加者・配布済みハンドアウトをまとめた閲覧専用URL（72時間有効）を発行
              </p>
            </div>
          </div>
          <SessionPackShareButton scenarioId={id} />
        </div>
      </div>

      {scenario.synopsis && (
        <div className="mb-4 rounded-xl border border-coc-border bg-coc-surface px-5 py-4">
          <p className="coc-section-title font-cinzel text-xs font-medium text-coc-muted uppercase tracking-widest mb-2">概要</p>
          <p className="text-sm text-coc-text whitespace-pre-wrap">{scenario.synopsis}</p>
        </div>
      )}

      {scenario.gm_notes && (
        <div className="mb-4 rounded-xl border border-coc-border bg-coc-raised px-5 py-4">
          <p className="coc-section-title font-cinzel text-xs font-medium text-coc-muted uppercase tracking-widest mb-2">GM メモ</p>
          <p className="text-sm text-coc-text whitespace-pre-wrap">{scenario.gm_notes}</p>
        </div>
      )}

      <div className="rounded-xl border border-coc-gold-dim bg-coc-raised px-5 py-4">
        <p className="coc-section-title font-cinzel text-xs font-medium text-coc-muted uppercase tracking-widest mb-3">次回予告 AI生成</p>
        <NextEpisodePreviewGenerator
          scenarioId={id}
          discordWebhookUrl={scenario.discord_webhook_url ?? null}
        />
      </div>

      <ScenarioDifficultyEvaluator scenarioId={id} />

      <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4">
        <p className="coc-section-title font-cinzel text-xs font-medium text-coc-muted uppercase tracking-widest mb-3">Discord 通知設定</p>
        <ScenarioDiscordWebhookEditor scenarioId={id} initialUrl={scenario.discord_webhook_url ?? null} />
      </div>

      <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4">
        <p className="coc-section-title font-cinzel text-xs font-medium text-coc-muted uppercase tracking-widest mb-3">リマインドメール設定</p>
        <ScenarioReminderEditor
          scenarioId={id}
          initialEnabled={scenario.remind_enabled ?? false}
          initialEmail={scenario.remind_email ?? null}
        />
      </div>

      {/* タグ */}
      <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4">
        <p className="coc-section-title font-cinzel text-xs font-medium text-coc-muted uppercase tracking-widest mb-3">タグ</p>
        <TagSelector entityType="scenario" entityId={id} />
      </div>

      {/* テンプレートライブラリ */}
      <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <p className="coc-section-title font-cinzel text-xs font-medium text-coc-muted uppercase tracking-widest">テンプレートライブラリ</p>
          <Link
            href="/kp/scenario-templates"
            className="flex items-center gap-1 text-xs text-coc-muted hover:text-coc-gold transition-colors"
          >
            <BookMarked size={12} />
            テンプレートを管理
          </Link>
        </div>
        <ScenarioTemplateToggle
          scenarioId={id}
          initialIsTemplate={scenario.is_template ?? false}
          initialPublishedAt={scenario.template_published_at ?? null}
        />
        <div className="mt-3 pt-3 border-t border-coc-border">
          <SaveAsTemplateButton scenarioId={id} scenarioTitle={scenario.title} />
        </div>
      </div>

      {/* ティザーページ */}
      <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4">
        <p className="coc-section-title font-cinzel text-xs font-medium text-coc-muted uppercase tracking-widest mb-3">ティザー公開ページ</p>
        <p className="text-xs text-coc-muted mb-3">ネタバレなしの紹介文・推奨人数・目安時間を公開URLで共有できます。SNS卓募集に貼るだけで参加者を集められます。</p>
        <TeaserEditor
          scenarioId={id}
          initialTeaserText={scenario.teaser_text ?? null}
          initialPlayersMin={scenario.recommended_players_min ?? null}
          initialPlayersMax={scenario.recommended_players_max ?? null}
          initialEstimatedHours={scenario.estimated_hours ?? null}
          initialIsPublic={scenario.teaser_is_public ?? false}
        />
      </div>

      {/* KP秘匿メモ */}
      <KpMemoSection entityType="scenario" entityId={id} />
    </div>
  );
}
