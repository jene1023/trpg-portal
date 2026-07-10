"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, TrendingUp } from "lucide-react";
import { supabase, isSupabaseConfigured, SessionFeedback } from "@/lib/supabase";

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
  const [feedbackList, setFeedbackList] = useState<SessionFeedback[]>([]);

  const [characterName, setCharacterName] = useState("");
  const [funRating, setFunRating] = useState(0);
  const [tensionRating, setTensionRating] = useState(0);
  const [facilitationRating, setFacilitationRating] = useState(0);
  const [wouldReplay, setWouldReplay] = useState<boolean | null>(null);
  const [freeComment, setFreeComment] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  useEffect(() => {
    const key = `session_feedback_submitted_${scenarioId}`;
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
          .from("session_feedback")
          .select("*")
          .eq("scenario_id", scenarioId)
          .order("created_at", { ascending: false }),
      ]);
      setScenarioTitle(scenario?.title ?? "");
      setFeedbackList((rows ?? []) as SessionFeedback[]);
      setLoading(false);
    })();
  }, [scenarioId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (
      !isSupabaseConfigured ||
      funRating === 0 ||
      tensionRating === 0 ||
      facilitationRating === 0 ||
      wouldReplay === null
    )
      return;
    setSaving(true);

    const payload = {
      scenario_id: scenarioId,
      session_id: null,
      character_id: null,
      character_name: isAnonymous ? null : (characterName.trim() || null),
      fun_rating: funRating,
      tension_rating: tensionRating,
      facilitation_rating: facilitationRating,
      would_replay: wouldReplay,
      free_comment: freeComment.trim() || null,
      is_anonymous: isAnonymous,
    };

    const { data } = await supabase
      .from("session_feedback")
      .insert(payload)
      .select("*")
      .single();

    if (data) {
      setFeedbackList((prev) => [data as SessionFeedback, ...prev]);
      localStorage.setItem(`session_feedback_submitted_${scenarioId}`, "1");
      setSubmitted(true);
    }

    setSaving(false);
  }

  const count = feedbackList.length;
  const avgFun = count > 0 ? feedbackList.reduce((s, f) => s + f.fun_rating, 0) / count : null;
  const avgTension = count > 0 ? feedbackList.reduce((s, f) => s + f.tension_rating, 0) / count : null;
  const avgFacilitation =
    count > 0 ? feedbackList.reduce((s, f) => s + f.facilitation_rating, 0) / count : null;
  const wouldReplayCount = feedbackList.filter((f) => f.would_replay).length;
  const publicFeedbacks = feedbackList.filter((f) => !f.is_anonymous);

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
          <TrendingUp size={20} className="text-coc-gold" />
          セッション満足度フィードバック
        </h1>
        <p className="text-xs text-coc-muted mt-1">
          セッション後の満足度をKPへ送信できます。送信後は編集できません。
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
              <div className="grid grid-cols-2 gap-4">
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
                  <p className="text-xs text-coc-muted mb-1">緊張感</p>
                  {avgTension !== null && (
                    <>
                      <StarDisplay value={avgTension} />
                      <p className="text-xs text-coc-gold mt-0.5">{avgTension.toFixed(1)}</p>
                    </>
                  )}
                </div>
                <div>
                  <p className="text-xs text-coc-muted mb-1">KPファシリテーション</p>
                  {avgFacilitation !== null && (
                    <>
                      <StarDisplay value={avgFacilitation} />
                      <p className="text-xs text-coc-gold mt-0.5">{avgFacilitation.toFixed(1)}</p>
                    </>
                  )}
                </div>
                <div>
                  <p className="text-xs text-coc-muted mb-1">また遊びたい</p>
                  <p className="text-sm font-bold text-coc-text">
                    {wouldReplayCount}/{count}
                  </p>
                  <p className="text-xs text-coc-muted">
                    {count > 0 ? Math.round((wouldReplayCount / count) * 100) : 0}%
                  </p>
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
                      KPには匿名で送信する
                    </label>
                  </div>

                  {!isAnonymous && (
                    <div>
                      <label className="text-xs text-coc-muted mb-1 block">
                        キャラクター名（任意）
                      </label>
                      <input
                        type="text"
                        value={characterName}
                        onChange={(e) => setCharacterName(e.target.value)}
                        placeholder="キャラクター名や PL 名"
                        className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:border-coc-gold focus:outline-none"
                      />
                    </div>
                  )}

                  <StarInput label="楽しさ *" value={funRating} onChange={setFunRating} />
                  <StarInput label="緊張感 *" value={tensionRating} onChange={setTensionRating} />
                  <StarInput
                    label="KPのファシリテーション *"
                    value={facilitationRating}
                    onChange={setFacilitationRating}
                  />

                  <div>
                    <p className="text-xs text-coc-muted mb-2">また遊びたいですか？ *</p>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setWouldReplay(true)}
                        className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                          wouldReplay === true
                            ? "border-coc-gold bg-coc-gold/10 text-coc-gold"
                            : "border-coc-border bg-coc-raised text-coc-muted hover:text-coc-text"
                        }`}
                      >
                        はい
                      </button>
                      <button
                        type="button"
                        onClick={() => setWouldReplay(false)}
                        className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                          wouldReplay === false
                            ? "border-red-800 bg-red-950/20 text-red-400"
                            : "border-coc-border bg-coc-raised text-coc-muted hover:text-coc-text"
                        }`}
                      >
                        いいえ
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-coc-muted mb-1 block">
                      自由コメント（任意）
                    </label>
                    <textarea
                      value={freeComment}
                      onChange={(e) => setFreeComment(e.target.value)}
                      rows={3}
                      placeholder="セッションの感想、印象的な場面、改善提案など..."
                      className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:border-coc-gold focus:outline-none resize-none"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={
                  saving ||
                  funRating === 0 ||
                  tensionRating === 0 ||
                  facilitationRating === 0 ||
                  wouldReplay === null
                }
                className="flex items-center justify-center gap-2 rounded-xl border border-coc-gold-dim bg-coc-surface px-5 py-3 text-sm font-medium text-coc-gold transition-colors hover:border-coc-gold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={16} />
                {saving ? "送信中..." : "フィードバックを送る"}
              </button>
            </form>
          )}

          {publicFeedbacks.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-medium text-coc-muted uppercase tracking-widest">
                フィードバック一覧（{publicFeedbacks.length}件表示）
              </p>
              {publicFeedbacks.map((f) => (
                <div
                  key={f.id}
                  className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <p className="text-sm font-medium text-coc-text">
                      {f.character_name ?? "プレイヤー"}
                    </p>
                    <p className="text-xs text-coc-muted flex-shrink-0">
                      {new Date(f.created_at).toLocaleDateString("ja-JP")}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-coc-muted">楽しさ</span>
                      <div className="mt-0.5">
                        <StarDisplay value={f.fun_rating} />
                      </div>
                    </div>
                    <div>
                      <span className="text-coc-muted">緊張感</span>
                      <div className="mt-0.5">
                        <StarDisplay value={f.tension_rating} />
                      </div>
                    </div>
                    <div>
                      <span className="text-coc-muted">ファシリ</span>
                      <div className="mt-0.5">
                        <StarDisplay value={f.facilitation_rating} />
                      </div>
                    </div>
                    <div>
                      <span className="text-coc-muted">また遊びたい</span>
                      <p
                        className={`mt-0.5 font-medium ${
                          f.would_replay ? "text-coc-gold" : "text-coc-muted"
                        }`}
                      >
                        {f.would_replay ? "はい" : "いいえ"}
                      </p>
                    </div>
                  </div>
                  {f.free_comment && (
                    <div className="mt-3 border-t border-coc-border pt-3">
                      <p className="text-xs text-coc-text whitespace-pre-wrap">{f.free_comment}</p>
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
