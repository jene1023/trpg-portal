"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, MessageSquarePlus, BarChart2 } from "lucide-react";
import { supabase, isSupabaseConfigured, SessionFeedbackPost } from "@/lib/supabase";

function StarInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <p className="text-xs text-coc-muted mb-2">{label}</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`text-2xl transition-colors ${
              star <= value ? "text-coc-gold" : "text-coc-border hover:text-coc-gold-dim"
            }`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
}

function StarDisplay({ value }: { value: number }) {
  const rounded = Math.round(value);
  return (
    <span className="inline-flex gap-0.5 text-sm">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= rounded ? "text-coc-gold" : "text-coc-border"}>
          ★
        </span>
      ))}
    </span>
  );
}

export default function SessionFeedbackPage() {
  const params = useParams<{ id: string }>();
  const scenarioId = params.id;

  const [scenarioTitle, setScenarioTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [feedbackList, setFeedbackList] = useState<SessionFeedbackPost[]>([]);

  const [funRating, setFunRating] = useState(0);
  const [scareRating, setScareRating] = useState(0);
  const [paceRating, setPaceRating] = useState(0);
  const [highlight, setHighlight] = useState("");
  const [improvement, setImprovement] = useState("");
  const [safetyConcern, setSafetyConcern] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  useEffect(() => {
    const key = `session_feedbacks_submitted_${scenarioId}`;
    if (typeof window !== "undefined" && localStorage.getItem(key)) {
      setSubmitted(true);
    }

    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    (async () => {
      const [{ data: scenario }, { data: rows }] = await Promise.all([
        supabase.from("scenarios").select("title").eq("id", scenarioId).single(),
        supabase
          .from("session_feedbacks")
          .select("*")
          .eq("scenario_id", scenarioId)
          .order("created_at", { ascending: false }),
      ]);
      setScenarioTitle(scenario?.title ?? "");
      setFeedbackList((rows ?? []) as SessionFeedbackPost[]);
      setLoading(false);
    })();
  }, [scenarioId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured || funRating === 0 || scareRating === 0 || paceRating === 0) return;
    setSaving(true);

    const payload = {
      scenario_id: scenarioId,
      voter_user_id: null,
      is_anonymous: isAnonymous,
      fun_rating: funRating,
      scare_rating: scareRating,
      pace_rating: paceRating,
      highlight: highlight.trim() || null,
      improvement: improvement.trim() || null,
      safety_concern: safetyConcern.trim() || null,
    };

    const { data } = await supabase
      .from("session_feedbacks")
      .insert(payload)
      .select("*")
      .single();

    if (data) {
      setFeedbackList((prev) => [data as SessionFeedbackPost, ...prev]);
      localStorage.setItem(`session_feedbacks_submitted_${scenarioId}`, "1");
      setSubmitted(true);
    }

    setSaving(false);
  }

  const count = feedbackList.length;
  const avgFun = count > 0 ? feedbackList.reduce((s, f) => s + f.fun_rating, 0) / count : null;
  const avgScare = count > 0 ? feedbackList.reduce((s, f) => s + f.scare_rating, 0) / count : null;
  const avgPace = count > 0 ? feedbackList.reduce((s, f) => s + f.pace_rating, 0) / count : null;

  const visibleFeedbacks = feedbackList.filter(
    (f) => f.highlight || f.improvement || f.safety_concern
  );

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
        <Link
          href={`/scenarios/${scenarioId}/feedback/results`}
          className="flex items-center gap-1.5 text-xs text-coc-gold hover:underline"
        >
          <BarChart2 size={14} />
          KP集計ビュー
        </Link>
      </div>

      <div className="mb-6">
        <p className="text-xs text-coc-muted mb-1">{scenarioTitle}</p>
        <h1 className="font-cinzel text-xl font-bold text-coc-text flex items-center gap-2">
          <MessageSquarePlus size={20} className="text-coc-gold" />
          セッション後フィードバック
        </h1>
        <p className="text-xs text-coc-muted mt-1">
          楽しかった点・怖かった点・ペースへの感想をKPへ送信できます。匿名で送ることも可能です。
        </p>
      </div>

      {!isSupabaseConfigured ? (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-8 text-center">
          <p className="text-coc-muted text-sm">Supabaseが設定されていません。</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {count > 0 && (
            <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-5">
              <p className="text-xs font-medium text-coc-muted uppercase tracking-widest mb-4">
                平均評価（{count}件）
              </p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-coc-muted mb-1">楽しさ</p>
                  {avgFun !== null && (
                    <>
                      <StarDisplay value={avgFun} />
                      <p className="text-xs text-coc-gold mt-0.5">{avgFun.toFixed(1)}</p>
                    </>
                  )}
                </div>
                <div>
                  <p className="text-xs text-coc-muted mb-1">怖さ</p>
                  {avgScare !== null && (
                    <>
                      <StarDisplay value={avgScare} />
                      <p className="text-xs text-coc-gold mt-0.5">{avgScare.toFixed(1)}</p>
                    </>
                  )}
                </div>
                <div>
                  <p className="text-xs text-coc-muted mb-1">ペース</p>
                  {avgPace !== null && (
                    <>
                      <StarDisplay value={avgPace} />
                      <p className="text-xs text-coc-gold mt-0.5">{avgPace.toFixed(1)}</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {submitted ? (
            <div className="rounded-xl border border-green-800 bg-green-950/20 px-5 py-8 text-center">
              <p className="text-green-400 font-medium mb-2">フィードバックを送信済みです</p>
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
                      匿名で送信する
                    </label>
                  </div>

                  <StarInput label="楽しさ *" value={funRating} onChange={setFunRating} />
                  <StarInput label="怖さ *" value={scareRating} onChange={setScareRating} />
                  <StarInput label="ペース *" value={paceRating} onChange={setPaceRating} />

                  <div>
                    <label className="text-xs text-coc-muted mb-1 block">
                      ハイライト（印象的だった場面・よかった点）
                    </label>
                    <textarea
                      value={highlight}
                      onChange={(e) => setHighlight(e.target.value)}
                      rows={2}
                      placeholder="楽しかった場面・うまくいったと思ったシーンなど..."
                      className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:border-coc-gold focus:outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-coc-muted mb-1 block">
                      改善点（次回に活かしてほしいこと）
                    </label>
                    <textarea
                      value={improvement}
                      onChange={(e) => setImprovement(e.target.value)}
                      rows={2}
                      placeholder="もう少し〇〇だったら嬉しかった、など..."
                      className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:border-coc-gold focus:outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-coc-muted mb-1 block">
                      セーフティ懸念（不快だった表現・配慮してほしかった点）
                    </label>
                    <textarea
                      value={safetyConcern}
                      onChange={(e) => setSafetyConcern(e.target.value)}
                      rows={2}
                      placeholder="（任意）気になった描写・セーフティに関するご意見..."
                      className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:border-coc-gold focus:outline-none resize-none"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving || funRating === 0 || scareRating === 0 || paceRating === 0}
                className="flex items-center justify-center gap-2 rounded-xl border border-coc-gold-dim bg-coc-surface px-5 py-3 text-sm font-medium text-coc-gold transition-colors hover:border-coc-gold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={16} />
                {saving ? "送信中..." : "フィードバックを送る"}
              </button>
            </form>
          )}

          {visibleFeedbacks.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-medium text-coc-muted uppercase tracking-widest">
                寄せられた声（{visibleFeedbacks.length}件）
              </p>
              {visibleFeedbacks.map((f) => (
                <div
                  key={f.id}
                  className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4"
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <p className="text-xs text-coc-muted">
                      {f.is_anonymous ? "匿名" : "投稿済み"}
                    </p>
                    <p className="text-xs text-coc-muted flex-shrink-0">
                      {new Date(f.created_at).toLocaleDateString("ja-JP")}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                    <div>
                      <span className="text-coc-muted">楽しさ</span>
                      <div className="mt-0.5">
                        <StarDisplay value={f.fun_rating} />
                      </div>
                    </div>
                    <div>
                      <span className="text-coc-muted">怖さ</span>
                      <div className="mt-0.5">
                        <StarDisplay value={f.scare_rating} />
                      </div>
                    </div>
                    <div>
                      <span className="text-coc-muted">ペース</span>
                      <div className="mt-0.5">
                        <StarDisplay value={f.pace_rating} />
                      </div>
                    </div>
                  </div>
                  {f.highlight && (
                    <div className="border-t border-coc-border pt-3 mb-2">
                      <p className="text-xs font-medium text-coc-muted mb-0.5">ハイライト</p>
                      <p className="text-sm text-coc-text whitespace-pre-wrap">{f.highlight}</p>
                    </div>
                  )}
                  {f.improvement && (
                    <div className="border-t border-coc-border pt-3 mb-2">
                      <p className="text-xs font-medium text-coc-muted mb-0.5">改善点</p>
                      <p className="text-sm text-coc-text whitespace-pre-wrap">{f.improvement}</p>
                    </div>
                  )}
                  {f.safety_concern && (
                    <div className="border-t border-coc-border pt-3">
                      <p className="text-xs font-medium text-yellow-500 mb-0.5">セーフティ懸念</p>
                      <p className="text-sm text-coc-text whitespace-pre-wrap">{f.safety_concern}</p>
                    </div>
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
