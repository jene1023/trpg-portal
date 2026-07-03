"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Star, Save } from "lucide-react";
import { supabase, isSupabaseConfigured, ScenarioReview } from "@/lib/supabase";

function StarInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`text-3xl transition-colors ${
            star <= value ? "text-coc-gold" : "text-coc-border hover:text-coc-gold-dim"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function StarDisplay({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-0.5 text-lg">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= value ? "text-coc-gold" : "text-coc-border"}>
          ★
        </span>
      ))}
    </span>
  );
}

export default function ScenarioReviewPage() {
  const params = useParams<{ id: string }>();
  const scenarioId = params.id;

  const [scenarioTitle, setScenarioTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [reviewId, setReviewId] = useState<string | null>(null);

  const [rating, setRating] = useState(0);
  const [wentWell, setWentWell] = useState("");
  const [improvements, setImprovements] = useState("");
  const [overallNotes, setOverallNotes] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    (async () => {
      const [{ data: scenario }, { data: review }] = await Promise.all([
        supabase.from("scenarios").select("title").eq("id", scenarioId).single(),
        supabase
          .from("scenario_reviews")
          .select("*")
          .eq("scenario_id", scenarioId)
          .maybeSingle(),
      ]);

      setScenarioTitle(scenario?.title ?? "");

      if (review) {
        const r = review as ScenarioReview;
        setReviewId(r.id);
        setRating(r.rating ?? 0);
        setWentWell(r.went_well ?? "");
        setImprovements(r.improvements ?? "");
        setOverallNotes(r.overall_notes ?? "");
      }

      setLoading(false);
    })();
  }, [scenarioId]);

  async function handleSave() {
    if (!isSupabaseConfigured || rating === 0) return;
    setSaving(true);

    const payload = {
      scenario_id: scenarioId,
      rating,
      went_well: wentWell.trim() || null,
      improvements: improvements.trim() || null,
      overall_notes: overallNotes.trim() || null,
      reviewed_at: new Date().toISOString(),
    };

    if (reviewId) {
      await supabase.from("scenario_reviews").update(payload).eq("id", reviewId);
    } else {
      const { data } = await supabase
        .from("scenario_reviews")
        .insert(payload)
        .select("id")
        .single();
      if (data) setReviewId(data.id);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

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
          KP振り返りレポート
        </h1>
      </div>

      {!isSupabaseConfigured ? (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-8 text-center">
          <p className="text-coc-muted text-sm">Supabaseが設定されていません。</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-5">
            <label className="text-xs font-medium text-coc-muted uppercase tracking-widest mb-3 block">
              総合評価 *
            </label>
            <StarInput value={rating} onChange={setRating} />
            {rating > 0 && (
              <p className="text-xs text-coc-muted mt-2">
                {["", "要改善", "やや不満", "普通", "良かった", "最高でした！"][rating]}
              </p>
            )}
          </div>

          <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-5">
            <label className="text-xs font-medium text-coc-muted uppercase tracking-widest mb-2 block">
              うまくいったこと
            </label>
            <textarea
              value={wentWell}
              onChange={(e) => setWentWell(e.target.value)}
              rows={4}
              placeholder="演出・判定・シーン展開など、うまく機能した点を記録..."
              className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:border-coc-gold focus:outline-none resize-none"
            />
          </div>

          <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-5">
            <label className="text-xs font-medium text-coc-muted uppercase tracking-widest mb-2 block">
              次回への改善点
            </label>
            <textarea
              value={improvements}
              onChange={(e) => setImprovements(e.target.value)}
              rows={4}
              placeholder="次回に向けて改善したい点・修正したいシーン・バランス調整など..."
              className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:border-coc-gold focus:outline-none resize-none"
            />
          </div>

          <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-5">
            <label className="text-xs font-medium text-coc-muted uppercase tracking-widest mb-2 block">
              総括メモ
            </label>
            <textarea
              value={overallNotes}
              onChange={(e) => setOverallNotes(e.target.value)}
              rows={4}
              placeholder="全体的な感想・反省・次のシナリオに活かしたいことなど..."
              className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:border-coc-gold focus:outline-none resize-none"
            />
          </div>

          {reviewId && (
            <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4">
              <p className="text-xs font-medium text-coc-muted uppercase tracking-widest mb-3">
                現在の評価
              </p>
              <StarDisplay value={rating} />
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving || rating === 0}
            className="flex items-center justify-center gap-2 rounded-xl border border-coc-gold-dim bg-coc-surface px-5 py-3 text-sm font-medium text-coc-gold transition-colors hover:border-coc-gold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={16} />
            {saving ? "保存中..." : saved ? "保存しました ✓" : "レポートを保存"}
          </button>
        </div>
      )}
    </div>
  );
}
