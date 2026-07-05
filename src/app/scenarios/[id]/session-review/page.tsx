"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ClipboardList, Plus, Trash2 } from "lucide-react";
import { supabase, isSupabaseConfigured, SessionReview } from "@/lib/supabase";

function ScoreInput({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
}) {
  return (
    <div>
      <p className="text-xs text-coc-muted mb-1.5">{label}</p>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`w-9 h-9 rounded-lg border text-sm font-bold transition-colors ${
              n <= value
                ? "border-coc-gold bg-coc-gold/20 text-coc-gold"
                : "border-coc-border bg-coc-raised text-coc-muted hover:border-coc-gold-dim"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

function ScoreBar({ score, label }: { score: number; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-16 text-coc-muted shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-coc-raised overflow-hidden">
        <div
          className="h-full rounded-full bg-coc-gold transition-all"
          style={{ width: `${(score / 5) * 100}%` }}
        />
      </div>
      <span className="w-4 text-right text-coc-text font-medium">{score}</span>
    </div>
  );
}

export default function SessionReviewPage() {
  const params = useParams<{ id: string }>();
  const scenarioId = params.id;

  const [scenarioTitle, setScenarioTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<SessionReview[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [sessionLabel, setSessionLabel] = useState("");
  const [funScore, setFunScore] = useState(0);
  const [tensionScore, setTensionScore] = useState(0);
  const [highlight, setHighlight] = useState("");
  const [improvement, setImprovement] = useState("");

  async function fetchData() {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    const [{ data: scenario }, { data: reviewData }] = await Promise.all([
      supabase.from("scenarios").select("title").eq("id", scenarioId).single(),
      supabase
        .from("session_reviews")
        .select("*")
        .eq("scenario_id", scenarioId)
        .order("created_at", { ascending: false }),
    ]);
    setScenarioTitle(scenario?.title ?? "");
    setReviews((reviewData as SessionReview[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioId]);

  function resetForm() {
    setSessionLabel("");
    setFunScore(0);
    setTensionScore(0);
    setHighlight("");
    setImprovement("");
    setShowForm(false);
  }

  async function handleSubmit() {
    if (!isSupabaseConfigured || funScore === 0 || tensionScore === 0) return;
    setSaving(true);

    await supabase.from("session_reviews").insert({
      scenario_id: scenarioId,
      session_label: sessionLabel.trim() || null,
      fun_score: funScore,
      tension_score: tensionScore,
      highlight: highlight.trim() || null,
      improvement: improvement.trim() || null,
      reviewed_at: new Date().toISOString(),
    });

    resetForm();
    await fetchData();
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!isSupabaseConfigured) return;
    await supabase.from("session_reviews").delete().eq("id", id);
    setReviews((prev) => prev.filter((r) => r.id !== id));
  }

  const avgFun =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.fun_score, 0) / reviews.length
      : null;
  const avgTension =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.tension_score, 0) / reviews.length
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
      <div className="flex items-center justify-between gap-3 mb-6">
        <Link
          href={`/scenarios/${scenarioId}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          シナリオ詳細
        </Link>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 rounded-lg border border-coc-gold-dim bg-coc-surface px-3 py-1.5 text-sm font-medium text-coc-gold hover:border-coc-gold transition-colors"
        >
          <Plus size={15} />
          振り返りを追加
        </button>
      </div>

      <div className="mb-6">
        <p className="text-xs text-coc-muted mb-1">{scenarioTitle}</p>
        <h1 className="font-cinzel text-xl font-bold text-coc-text flex items-center gap-2">
          <ClipboardList size={20} className="text-coc-gold" />
          卓振り返りフォーム
        </h1>
      </div>

      {!isSupabaseConfigured ? (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-8 text-center">
          <p className="text-coc-muted text-sm">Supabaseが設定されていません。</p>
        </div>
      ) : (
        <>
          {/* 平均スコアサマリー */}
          {reviews.length > 0 && (
            <div className="rounded-xl border border-coc-gold-dim bg-coc-raised px-5 py-4 mb-5">
              <p className="text-xs font-medium text-coc-muted uppercase tracking-widest mb-3">
                平均スコア（{reviews.length}件）
              </p>
              <div className="flex flex-col gap-2">
                <ScoreBar score={Math.round((avgFun ?? 0) * 10) / 10} label="楽しさ" />
                <ScoreBar
                  score={Math.round((avgTension ?? 0) * 10) / 10}
                  label="緊張感"
                />
              </div>
            </div>
          )}

          {/* 追加フォーム */}
          {showForm && (
            <div className="rounded-xl border border-coc-gold bg-coc-surface px-5 py-5 mb-5 flex flex-col gap-4">
              <p className="text-sm font-medium text-coc-text">新規振り返りを記録</p>

              <div>
                <label className="text-xs font-medium text-coc-muted uppercase tracking-widest mb-1.5 block">
                  セッション識別（任意）
                </label>
                <input
                  type="text"
                  value={sessionLabel}
                  onChange={(e) => setSessionLabel(e.target.value)}
                  placeholder="例: 第3回 / 2024-03-15"
                  className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:border-coc-gold focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-3">
                <ScoreInput value={funScore} onChange={setFunScore} label="楽しさ *" />
                <ScoreInput
                  value={tensionScore}
                  onChange={setTensionScore}
                  label="緊張感 *"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-coc-muted uppercase tracking-widest mb-1.5 block">
                  印象的な場面
                </label>
                <textarea
                  value={highlight}
                  onChange={(e) => setHighlight(e.target.value)}
                  rows={3}
                  placeholder="特に印象に残ったシーン・ロールプレイ・演出など..."
                  className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:border-coc-gold focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-coc-muted uppercase tracking-widest mb-1.5 block">
                  次回への改善点
                </label>
                <textarea
                  value={improvement}
                  onChange={(e) => setImprovement(e.target.value)}
                  rows={3}
                  placeholder="次のセッションで改善したいこと・やってみたいことなど..."
                  className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:border-coc-gold focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSubmit}
                  disabled={saving || funScore === 0 || tensionScore === 0}
                  className="flex-1 rounded-lg border border-coc-gold-dim bg-coc-raised px-4 py-2.5 text-sm font-medium text-coc-gold transition-colors hover:border-coc-gold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "保存中..." : "記録する"}
                </button>
                <button
                  onClick={resetForm}
                  className="rounded-lg border border-coc-border bg-coc-raised px-4 py-2.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}

          {/* 一覧 */}
          {reviews.length === 0 ? (
            <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-10 text-center">
              <ClipboardList size={32} className="text-coc-border mx-auto mb-3" />
              <p className="text-sm text-coc-muted">
                振り返りがまだありません。
              </p>
              <p className="text-xs text-coc-muted mt-1">
                セッション終了後に感想・評価を記録しましょう。
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {reviews.map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      {r.session_label && (
                        <p className="text-xs text-coc-gold font-medium mb-0.5">
                          {r.session_label}
                        </p>
                      )}
                      <p className="text-xs text-coc-muted">
                        {r.reviewed_at
                          ? new Date(r.reviewed_at).toLocaleDateString("ja-JP")
                          : new Date(r.created_at).toLocaleDateString("ja-JP")}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="text-coc-muted hover:text-red-400 transition-colors shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="flex flex-col gap-1.5 mb-3">
                    <ScoreBar score={r.fun_score} label="楽しさ" />
                    <ScoreBar score={r.tension_score} label="緊張感" />
                  </div>

                  {r.highlight && (
                    <div className="mb-2">
                      <p className="text-xs font-medium text-coc-muted mb-1">
                        印象的な場面
                      </p>
                      <p className="text-sm text-coc-text whitespace-pre-wrap">
                        {r.highlight}
                      </p>
                    </div>
                  )}

                  {r.improvement && (
                    <div>
                      <p className="text-xs font-medium text-coc-muted mb-1">
                        改善点
                      </p>
                      <p className="text-sm text-coc-text whitespace-pre-wrap">
                        {r.improvement}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
