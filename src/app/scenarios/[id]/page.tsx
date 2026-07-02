export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, FileText, User, Shield, StickyNote, Swords, CalendarClock, ShieldCheck, ClipboardList, BarChart2, MapPin, Vote, Bug, Music, ListChecks, Star, Clock, ExternalLink, UserCheck, Monitor } from "lucide-react";
import { supabase, isSupabaseConfigured, ScenarioStatus, AttendanceStatus } from "@/lib/supabase";
import ScenarioDuplicateButton from "@/app/_components/ScenarioDuplicateButton";

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

type Props = { params: Promise<{ id: string }> };

export default async function ScenarioDetailPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

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
  ] = await Promise.all([
    supabase.from("handouts").select("*", { count: "exact", head: true }).eq("scenario_id", id),
    supabase.from("scenario_participants").select("id, attendance_status").eq("scenario_id", id),
    supabase.from("npcs").select("*", { count: "exact", head: true }).eq("scenario_name", scenario.title),
    supabase.from("creatures").select("*", { count: "exact", head: true }).eq("scenario_id", id),
    supabase.from("scenario_player_ratings").select("fun_rating, horror_rating, mystery_rating, character_rating").eq("scenario_id", id),
  ]);

  const ratingCount = ratingRows?.length ?? 0;
  const avgFun = ratingCount > 0 ? (ratingRows!.reduce((s, r) => s + r.fun_rating, 0) / ratingCount) : null;
  const avgHorror = ratingCount > 0 ? (ratingRows!.reduce((s, r) => s + r.horror_rating, 0) / ratingCount) : null;
  const avgMystery = ratingCount > 0 ? (ratingRows!.reduce((s, r) => s + r.mystery_rating, 0) / ratingCount) : null;
  const avgCharacter = ratingCount > 0 ? (ratingRows!.reduce((s, r) => s + r.character_rating, 0) / ratingCount) : null;

  const participantCount = participantRows?.length ?? 0;
  const attendingCount = participantRows?.filter((p) => (p.attendance_status as AttendanceStatus) === "attending").length ?? 0;
  const absentCount = participantRows?.filter((p) => (p.attendance_status as AttendanceStatus) === "absent").length ?? 0;
  const unconfirmedCount = participantCount - attendingCount - absentCount;

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
        <ScenarioDuplicateButton scenarioId={id} />
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
        </div>
        {scenario.played_at && (
          <p className="text-xs text-coc-muted">プレイ日: {scenario.played_at}</p>
        )}
        {scenario.next_session_at && (
          <div className="mt-3 flex items-center gap-1.5 w-fit rounded-full border border-coc-gold-dim bg-coc-raised px-3 py-1 text-xs font-medium text-coc-gold">
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
        )}
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
      </div>

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
          href={`/scenarios/${id}/combat`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <Swords size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">戦闘管理</p>
              <p className="text-xs text-coc-muted">ラウンド数・DEX順イニシアチブを追跡</p>
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
          href={`/npcs?scenario=${encodeURIComponent(scenario.title)}`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <User size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">NPC一覧</p>
              <p className="text-xs text-coc-muted">このシナリオのNPCを確認</p>
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
          <span className="text-coc-muted">→</span>
        </Link>

        <Link
          href={`/creatures?scenario=${id}`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <Bug size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">クリーチャー</p>
              <p className="text-xs text-coc-muted">神話的クリーチャーのSAN喪失・能力値を管理</p>
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
          href={`/scenarios/${id}/agenda`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-3">
            <ListChecks size={20} className="text-coc-gold" />
            <div>
              <p className="font-medium text-coc-text">アジェンダ</p>
              <p className="text-xs text-coc-muted">場面別プランナーでセッションの流れを事前計画</p>
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
      </div>

      {scenario.synopsis && (
        <div className="mb-4 rounded-xl border border-coc-border bg-coc-surface px-5 py-4">
          <p className="coc-section-title font-cinzel text-xs font-medium text-coc-muted uppercase tracking-widest mb-2">概要</p>
          <p className="text-sm text-coc-text whitespace-pre-wrap">{scenario.synopsis}</p>
        </div>
      )}

      {scenario.gm_notes && (
        <div className="rounded-xl border border-coc-border bg-coc-raised px-5 py-4">
          <p className="coc-section-title font-cinzel text-xs font-medium text-coc-muted uppercase tracking-widest mb-2">GM メモ</p>
          <p className="text-sm text-coc-text whitespace-pre-wrap">{scenario.gm_notes}</p>
        </div>
      )}
    </div>
  );
}
