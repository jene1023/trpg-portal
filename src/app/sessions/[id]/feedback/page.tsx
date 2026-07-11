"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, Star } from "lucide-react";
import { supabase, isSupabaseConfigured, SessionFeedbackEntry } from "@/lib/supabase";

function StarInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className={`text-2xl transition-colors ${
            star <= (hover || value) ? "text-coc-gold" : "text-coc-border hover:text-coc-gold-dim"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function StarDisplay({ value }: { value: number }) {
  const rounded = Math.round(value);
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= rounded ? "text-coc-gold" : "text-coc-border"}>
          ★
        </span>
      ))}
    </span>
  );
}

export default function SessionFeedbackFormPage() {
  const params = useParams<{ id: string }>();
  const sessionId = params.id;

  const [sessionTitle, setSessionTitle] = useState("");
  const [characterName, setCharacterName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [feedbacks, setFeedbacks] = useState<SessionFeedbackEntry[]>([]);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  useEffect(() => {
    const key = `session_feedback_submitted_${sessionId}`;
    if (typeof window !== "undefined" && localStorage.getItem(key)) {
      setSubmitted(true);
    }

    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    (async () => {
      const [{ data: session }, { data: rows }] = await Promise.all([
        supabase
          .from("sessions")
          .select("title, session_number, characters(name)")
          .eq("id", sessionId)
          .single(),
        supabase
          .from("session_feedbacks")
          .select("*")
          .eq("session_id", sessionId)
          .eq("is_anonymous", false)
          .order("created_at", { ascending: false }),
      ]);

      if (session) {
        const char = (session.characters as unknown as { name: string } | null);
        setCharacterName(char?.name ?? "");
        setSessionTitle(`${char?.name ?? ""} — セッション #${session.session_number} ${session.title}`);
      }
      setFeedbacks((rows ?? []) as SessionFeedbackEntry[]);
      setLoading(false);
    })();
  }, [sessionId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured || rating === 0) return;
    setSaving(true);

    let fromUserId: string | null = null;
    try {
      const { data: authData } = await supabase.auth.getUser();
      fromUserId = authData.user?.id ?? null;
    } catch {
      // auth not available
    }

    const { data } = await supabase
      .from("session_feedbacks")
      .insert({
        session_id: sessionId,
        from_user_id: fromUserId,
        rating,
        comment: comment.trim() || null,
        is_anonymous: isAnonymous,
      })
      .select("*")
      .single();

    if (data) {
      if (!isAnonymous) {
        setFeedbacks((prev) => [data as SessionFeedbackEntry, ...prev]);
      }
      localStorage.setItem(`session_feedback_submitted_${sessionId}`, "1");
      setSubmitted(true);
    }

    setSaving(false);
  }

  const avgRating =
    feedbacks.length > 0
      ? feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length
      : null;

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-sm text-coc-muted">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="coc-page-enter mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/sessions/${sessionId}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          セッション詳細
        </Link>
      </div>

      <div className="mb-6">
        <p className="text-xs text-coc-muted mb-1">{characterName}</p>
        <h1 className="font-cinzel text-xl font-bold text-coc-text flex items-center gap-2">
          <Star size={20} className="text-coc-gold" />
          PLフィードバック
        </h1>
        {sessionTitle && (
          <p className="text-xs text-coc-muted mt-1">{sessionTitle}</p>
        )}
      </div>

      {!isSupabaseConfigured ? (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-8 text-center">
          <p className="text-coc-muted text-sm">Supabaseが設定されていません。</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {avgRating !== null && feedbacks.length > 0 && (
            <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4">
              <p className="text-xs font-medium text-coc-muted uppercase tracking-widest mb-3">
                平均評価（{feedbacks.length}件）
              </p>
              <div className="flex items-center gap-3">
                <StarDisplay value={avgRating} />
                <span className="text-lg font-bold text-coc-gold">{avgRating.toFixed(1)}</span>
                <span className="text-xs text-coc-muted">/ 5.0</span>
              </div>
            </div>
          )}

          {submitted ? (
            <div className="rounded-xl border border-green-800 bg-green-950/20 px-5 py-8 text-center">
              <p className="text-green-400 font-medium mb-2">フィードバックを送信しました</p>
              <p className="text-xs text-coc-muted">ご回答ありがとうございました。</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-5">
                <p className="text-xs font-medium text-coc-muted uppercase tracking-widest mb-4">
                  フィードバックを送る
                </p>
                <div className="flex flex-col gap-5">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is-anonymous"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="accent-coc-gold"
                    />
                    <label htmlFor="is-anonymous" className="text-xs text-coc-muted cursor-pointer">
                      KPには匿名で送信する
                    </label>
                  </div>

                  <div>
                    <p className="text-xs text-coc-muted mb-2">総合評価 *</p>
                    <StarInput value={rating} onChange={setRating} />
                    {rating > 0 && (
                      <p className="text-xs text-coc-gold mt-1">
                        {["", "残念だった", "まあまあ", "良かった", "とても良かった", "最高だった"][rating]}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs text-coc-muted mb-1 block">
                      コメント（任意）
                    </label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={4}
                      placeholder="セッションの感想、印象的な場面、KPへの感謝や改善提案など..."
                      className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:border-coc-gold focus:outline-none resize-none"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving || rating === 0}
                className="flex items-center justify-center gap-2 rounded-xl border border-coc-gold-dim bg-coc-surface px-5 py-3 text-sm font-medium text-coc-gold transition-colors hover:border-coc-gold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={16} />
                {saving ? "送信中..." : "フィードバックを送る"}
              </button>
            </form>
          )}

          {feedbacks.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-medium text-coc-muted uppercase tracking-widest">
                フィードバック一覧（{feedbacks.length}件）
              </p>
              {feedbacks.map((f) => (
                <div
                  key={f.id}
                  className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <StarDisplay value={f.rating} />
                    <p className="text-xs text-coc-muted flex-shrink-0">
                      {new Date(f.created_at).toLocaleDateString("ja-JP")}
                    </p>
                  </div>
                  {f.comment && (
                    <p className="text-xs text-coc-text whitespace-pre-wrap mt-2 border-l-2 border-coc-border pl-3 leading-relaxed">
                      {f.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
