export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, FileText, User, Shield, StickyNote, Swords, CalendarClock } from "lucide-react";
import { supabase, isSupabaseConfigured, ScenarioStatus } from "@/lib/supabase";
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
    { count: participantCount },
    { count: npcCount },
  ] = await Promise.all([
    supabase.from("handouts").select("*", { count: "exact", head: true }).eq("scenario_id", id),
    supabase.from("scenario_participants").select("*", { count: "exact", head: true }).eq("scenario_id", id),
    supabase.from("npcs").select("*", { count: "exact", head: true }).eq("scenario_name", scenario.title),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
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
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl border border-coc-border bg-coc-surface px-4 py-3 text-center">
          <p className="text-2xl font-bold text-coc-text">{participantCount ?? 0}</p>
          <p className="text-xs text-coc-muted mt-1">参加者</p>
        </div>
        <div className="rounded-xl border border-coc-border bg-coc-surface px-4 py-3 text-center">
          <p className="text-2xl font-bold text-coc-text">{handoutCount ?? 0}</p>
          <p className="text-xs text-coc-muted mt-1">ハンドアウト</p>
        </div>
        <div className="rounded-xl border border-coc-border bg-coc-surface px-4 py-3 text-center">
          <p className="text-2xl font-bold text-coc-text">{npcCount ?? 0}</p>
          <p className="text-xs text-coc-muted mt-1">NPC</p>
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
      </div>

      {scenario.synopsis && (
        <div className="mb-4 rounded-xl border border-coc-border bg-coc-surface px-5 py-4">
          <p className="text-xs font-medium text-coc-muted mb-2">概要</p>
          <p className="text-sm text-coc-text whitespace-pre-wrap">{scenario.synopsis}</p>
        </div>
      )}

      {scenario.gm_notes && (
        <div className="rounded-xl border border-coc-border bg-coc-raised px-5 py-4">
          <p className="text-xs font-medium text-coc-muted mb-2">GM メモ</p>
          <p className="text-sm text-coc-text whitespace-pre-wrap">{scenario.gm_notes}</p>
        </div>
      )}
    </div>
  );
}
