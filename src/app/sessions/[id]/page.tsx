export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageSquarePlus, BarChart2, Share2, Newspaper, ClipboardCheck, CalendarClock } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import FeedbackCopyButton from "@/app/_components/FeedbackCopyButton";

type Props = { params: Promise<{ id: string }> };

export default async function SessionDetailPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: session } = await supabase
    .from("sessions")
    .select("id, character_id, session_number, title, summary, played_at, characters(name)")
    .eq("id", id)
    .single();

  if (!session) notFound();

  const char = (session.characters as unknown as { name: string } | null);

  const { count: feedbackCount } = await supabase
    .from("session_feedbacks")
    .select("*", { count: "exact", head: true })
    .eq("session_id", id);

  return (
    <div className="coc-page-enter mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/characters/${session.character_id}/sessions`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          {char?.name ?? "キャラクター"}
        </Link>
      </div>

      <div className="mb-6">
        <p className="text-xs text-coc-muted mb-1">
          {char?.name} — セッション #{session.session_number}
        </p>
        <h1 className="font-cinzel text-xl font-bold text-coc-text">{session.title}</h1>
        {session.played_at && (
          <p className="text-xs text-coc-muted mt-1">
            {new Date(session.played_at).toLocaleDateString("ja-JP")}
          </p>
        )}
      </div>

      {session.summary && (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4 mb-6">
          <p className="text-xs font-medium text-coc-muted uppercase tracking-widest mb-2">セッション概要</p>
          <p className="text-sm text-coc-text whitespace-pre-wrap leading-relaxed">{session.summary}</p>
        </div>
      )}

      <div className="flex flex-col gap-3 mb-6">
        <Link
          href={`/sessions/${id}/timetable`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold-dim transition-colors group"
        >
          <div className="flex items-center gap-3">
            <CalendarClock size={18} className="text-coc-gold" />
            <div>
              <p className="text-sm font-medium text-coc-text">タイムスケジュール</p>
              <p className="text-xs text-coc-muted">KP向け — セッション当日の進行タイムテーブル</p>
            </div>
          </div>
          <span className="text-coc-muted group-hover:text-coc-text transition-colors">→</span>
        </Link>

        <Link
          href={`/sessions/${id}/preflight`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold-dim transition-colors group"
        >
          <div className="flex items-center gap-3">
            <ClipboardCheck size={18} className="text-coc-gold" />
            <div>
              <p className="text-sm font-medium text-coc-text">プレフライトチェック</p>
              <p className="text-xs text-coc-muted">KP向け — セッション開始前の確認チェックリスト</p>
            </div>
          </div>
          <span className="text-coc-muted group-hover:text-coc-text transition-colors">→</span>
        </Link>

        <Link
          href={`/sessions/${id}/report`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold-dim transition-colors group"
        >
          <div className="flex items-center gap-3">
            <Newspaper size={18} className="text-coc-gold" />
            <div>
              <p className="text-sm font-medium text-coc-text">卓報告カード生成</p>
              <p className="text-xs text-coc-muted">SNS投稿用テキストを自動生成</p>
            </div>
          </div>
          <span className="text-coc-muted group-hover:text-coc-text transition-colors">→</span>
        </Link>

        <Link
          href={`/sessions/${id}/feedback`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold-dim transition-colors group"
        >
          <div className="flex items-center gap-3">
            <MessageSquarePlus size={18} className="text-coc-gold" />
            <div>
              <p className="text-sm font-medium text-coc-text">フィードバックを送る</p>
              <p className="text-xs text-coc-muted">PLとしてこのセッションの感想を送信</p>
            </div>
          </div>
          <span className="text-coc-muted group-hover:text-coc-text transition-colors">→</span>
        </Link>

        <Link
          href={`/sessions/${id}/feedback/results`}
          className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold-dim transition-colors group"
        >
          <div className="flex items-center gap-3">
            <BarChart2 size={18} className="text-coc-gold" />
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-coc-text">フィードバック結果</p>
                {(feedbackCount ?? 0) > 0 && (
                  <span className="rounded-full border border-coc-gold-dim bg-coc-gold/10 px-1.5 py-0.5 text-xs text-coc-gold">
                    {feedbackCount}件
                  </span>
                )}
              </div>
              <p className="text-xs text-coc-muted">KP向け — 平均評価・コメント一覧</p>
            </div>
          </div>
          <span className="text-coc-muted group-hover:text-coc-text transition-colors">→</span>
        </Link>
      </div>

      <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4">
        <div className="flex items-center gap-2 mb-3">
          <Share2 size={15} className="text-coc-muted" />
          <p className="text-xs font-medium text-coc-muted uppercase tracking-widest">PLへ共有</p>
        </div>
        <p className="text-xs text-coc-muted mb-3">
          以下のURLをPLへ送ることでフィードバックフォームを共有できます。
        </p>
        <FeedbackCopyButton path={`/sessions/${id}/feedback`} />
      </div>
    </div>
  );
}
