"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Star } from "lucide-react";
import { supabase, isSupabaseConfigured, ScenarioParticipantReview } from "@/lib/supabase";

function StarInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className={`text-3xl transition-colors ${
            star <= (hovered || value) ? "text-coc-gold" : "text-coc-border hover:text-coc-gold-dim"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function StarDisplay({ value }: { value: number }) {
  const filled = Math.round(value);
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= filled ? "text-coc-gold" : "text-coc-border"}>
          ★
        </span>
      ))}
    </span>
  );
}

const RATING_LABELS = ["", "つまらなかった", "いまいち", "普通", "良かった", "最高でした！"];

export default function ScenarioReviewsPage() {
  const params = useParams<{ id: string }>();
  const scenarioId = params.id;

  const [scenarioTitle, setScenarioTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [reviews, setReviews] = useState<ScenarioParticipantReview[]>([]);
  const [reviewerName, setReviewerName] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSpoiler, setIsSpoiler] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    (async () => {
      const [{ data: scenario }, { data: reviewRows }] = await Promise.all([
        supabase.from("scenarios").select("title").eq("id", scenarioId).single(),
        supabase
          .from("scenario_participant_reviews")
          .select("*")
          .eq("scenario_id", scenarioId)
          .order("created_at", { ascending: false }),
      ]);
      setScenarioTitle(scenario?.title ?? "");
      setReviews((reviewRows ?? []) as ScenarioParticipantReview[]);
      setLoading(false);
    })();
  }, [scenarioId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured || !reviewerName.trim() || rating === 0) return;
    setSaving(true);

    const payload = {
      scenario_id: scenarioId,
      reviewer_name: reviewerName.trim(),
      rating,
      comment: comment.trim() || null,
      is_spoiler: isSpoiler,
    };

    const existing = reviews.find((r) => r.reviewer_name === reviewerName.trim());
    if (existing) {
      const { data } = await supabase
        .from("scenario_participant_reviews")
        .update(payload)
        .eq("id", existing.id)
        .select("*")
        .single();
      if (data) {
        setReviews((prev) =>
          prev.map((r) => (r.id === existing.id ? (data as ScenarioParticipantReview) : r))
        );
      }
    } else {
      const { data } = await supabase
        .from("scenario_participant_reviews")
        .insert(payload)
        .select("*")
        .single();
      if (data) {
        setReviews((prev) => [data as ScenarioParticipantReview, ...prev]);
      }
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    setComment("");
    setIsSpoiler(false);
  }

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
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
          href={`/scenarios/${scenarioId}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          シナリオ詳細
        </Link>
      </div>

      <div className="mb-6">
        <p className="text-xs text-coc-muted mb-1">{scenarioTitle}</p>
        <h1 className="font-cinzel text-xl font-bold text-coc-text flex items-center gap-2">
          <Star size={20} className="text-coc-gold" />
          シナリオレビュー
        </h1>
        {avgRating !== null && (
          <div className="mt-3 flex items-center gap-3">
            <StarDisplay value={avgRating} />
            <span className="text-coc-gold font-bold">{avgRating.toFixed(1)}</span>
            <span className="text-xs text-coc-muted">（{reviews.length}件のレビュー）</span>
          </div>
        )}
      </div>

      {!isSupabaseConfigured ? (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-8 text-center">
          <p className="text-coc-muted text-sm">Supabaseが設定されていません。</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-5">
              <p className="text-xs font-medium text-coc-muted uppercase tracking-widest mb-4">
                レビューを投稿する
              </p>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs text-coc-muted mb-1 block">お名前 *</label>
                  <input
                    type="text"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    placeholder="PL名を入力（同じ名前で再送すると上書きされます）"
                    required
                    className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:border-coc-gold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-coc-muted mb-2 block">総合評価 *</label>
                  <StarInput value={rating} onChange={setRating} />
                  {rating > 0 && (
                    <p className="text-xs text-coc-muted mt-1">{RATING_LABELS[rating]}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs text-coc-muted mb-1 block">コメント（任意）</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    placeholder="感想・印象に残ったシーン・このシナリオの魅力など..."
                    className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:border-coc-gold focus:outline-none resize-none"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isSpoiler}
                    onChange={(e) => setIsSpoiler(e.target.checked)}
                    className="accent-coc-gold w-4 h-4"
                  />
                  <span className="text-sm text-coc-muted">
                    ネタバレを含む（デフォルトで折りたたまれます）
                  </span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving || !reviewerName.trim() || rating === 0}
              className="flex items-center justify-center gap-2 rounded-xl border border-coc-gold-dim bg-coc-surface px-5 py-3 text-sm font-medium text-coc-gold transition-colors hover:border-coc-gold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Star size={16} />
              {saving ? "送信中..." : saved ? "送信しました ✓" : "レビューを投稿"}
            </button>
          </form>

          {reviews.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-medium text-coc-muted uppercase tracking-widest">
                みんなのレビュー
              </p>
              {reviews.map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-coc-text">{r.reviewer_name}</p>
                    <p className="text-xs text-coc-muted">
                      {new Date(r.created_at).toLocaleDateString("ja-JP")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <StarDisplay value={r.rating} />
                    <span className="text-xs text-coc-muted">{RATING_LABELS[r.rating]}</span>
                  </div>
                  {r.comment && (
                    r.is_spoiler ? (
                      <details className="mt-2">
                        <summary className="text-xs text-yellow-400 cursor-pointer select-none">
                          ⚠ ネタバレを表示する
                        </summary>
                        <p className="text-xs text-coc-text whitespace-pre-wrap mt-2 border-t border-coc-border pt-2">
                          {r.comment}
                        </p>
                      </details>
                    ) : (
                      <p className="text-xs text-coc-text whitespace-pre-wrap border-t border-coc-border pt-2 mt-2">
                        {r.comment}
                      </p>
                    )
                  )}
                </div>
              ))}
            </div>
          )}

          {reviews.length === 0 && (
            <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-8 text-center">
              <Star size={32} className="text-coc-border mx-auto mb-3" />
              <p className="text-sm text-coc-muted">まだレビューがありません。</p>
              <p className="text-xs text-coc-muted mt-1">最初のレビューを投稿しましょう！</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
