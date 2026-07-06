"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageSquarePlus, Star } from "lucide-react";
import { supabase, isSupabaseConfigured, PlayerFeedback } from "@/lib/supabase";

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

export default function FeedbackPage() {
  const params = useParams<{ id: string }>();
  const scenarioId = params.id;

  const [scenarioTitle, setScenarioTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [feedbackList, setFeedbackList] = useState<PlayerFeedback[]>([]);

  const [playerName, setPlayerName] = useState("");
  const [sessionLabel, setSessionLabel] = useState("");
  const [funScore, setFunScore] = useState(0);
  const [highlight, setHighlight] = useState("");
  const [improvement, setImprovement] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    (async () => {
      const [{ data: scenario }, { data: rows }] = await Promise.all([
        supabase.from("scenarios").select("title").eq("id", scenarioId).single(),
        supabase
          .from("player_feedback")
          .select("*")
          .eq("scenario_id", scenarioId)
          .order("created_at", { ascending: false }),
      ]);
      setScenarioTitle(scenario?.title ?? "");
      setFeedbackList((rows ?? []) as PlayerFeedback[]);
      setLoading(false);
    })();
  }, [scenarioId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured || !playerName.trim() || funScore === 0) return;
    setSaving(true);

    const payload = {
      scenario_id: scenarioId,
      session_label: sessionLabel.trim() || null,
      player_name: playerName.trim(),
      fun_score: funScore,
      highlight: highlight.trim() || null,
      improvement: improvement.trim() || null,
    };

    const { data } = await supabase
      .from("player_feedback")
      .insert(payload)
      .select("*")
      .single();

    if (data) {
      setFeedbackList((prev) => [data as PlayerFeedback, ...prev]);
      setPlayerName("");
      setSessionLabel("");
      setFunScore(0);
      setHighlight("");
      setImprovement("");
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const avgFun =
    feedbackList.length > 0
      ? feedbackList.reduce((s, f) => s + f.fun_score, 0) / feedbackList.length
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
          <MessageSquarePlus size={20} className="text-coc-gold" />
          PLフィードバック
        </h1>
        <p className="text-xs text-coc-muted mt-1">
          セッション後の感想をKPへ匿名で送れます。認証不要です。
        </p>
      </div>

      {!isSupabaseConfigured ? (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-8 text-center">
          <p className="text-coc-muted text-sm">Supabaseが設定されていません。</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {avgFun !== null && (
            <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-5">
              <p className="text-xs font-medium text-coc-muted uppercase tracking-widest mb-3">
                平均評価（{feedbackList.length}件）
              </p>
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <p className="text-xs text-coc-muted mb-1">楽しさ</p>
                  <StarDisplay value={avgFun} />
                  <p className="text-xs text-coc-gold mt-1">{avgFun.toFixed(1)}</p>
                </div>
              </div>
            </div>
          )}

          {saved && (
            <div className="rounded-xl border border-green-800 bg-green-950/20 px-4 py-3 text-center">
              <p className="text-sm text-green-400">フィードバックを送信しました。ありがとうございます！</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-5">
              <p className="text-xs font-medium text-coc-muted uppercase tracking-widest mb-4">
                フィードバックを送る
              </p>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs text-coc-muted mb-1 block">お名前 *</label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="PL名（匿名の場合は「匿名」等）"
                    required
                    className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:border-coc-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-coc-muted mb-1 block">セッション回（任意）</label>
                  <input
                    type="text"
                    value={sessionLabel}
                    onChange={(e) => setSessionLabel(e.target.value)}
                    placeholder="例: 第3回、最終回 など"
                    className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:border-coc-gold focus:outline-none"
                  />
                </div>
                <StarInput label="楽しさ *" value={funScore} onChange={setFunScore} />
                <div>
                  <label className="text-xs text-coc-muted mb-1 block">印象的な場面・良かった点（任意）</label>
                  <textarea
                    value={highlight}
                    onChange={(e) => setHighlight(e.target.value)}
                    rows={3}
                    placeholder="特に楽しかった場面や演出を書いてください..."
                    className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:border-coc-gold focus:outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-coc-muted mb-1 block">改善提案（任意）</label>
                  <textarea
                    value={improvement}
                    onChange={(e) => setImprovement(e.target.value)}
                    rows={3}
                    placeholder="次回への改善提案があれば..."
                    className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:border-coc-gold focus:outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving || !playerName.trim() || funScore === 0}
              className="flex items-center justify-center gap-2 rounded-xl border border-coc-gold-dim bg-coc-surface px-5 py-3 text-sm font-medium text-coc-gold transition-colors hover:border-coc-gold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Star size={16} />
              {saving ? "送信中..." : "フィードバックを送る"}
            </button>
          </form>

          {feedbackList.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-medium text-coc-muted uppercase tracking-widest">
                送信されたフィードバック（{feedbackList.length}件）
              </p>
              {feedbackList.map((f) => (
                <div
                  key={f.id}
                  className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="text-sm font-medium text-coc-text">{f.player_name}</p>
                      {f.session_label && (
                        <p className="text-xs text-coc-muted">{f.session_label}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <StarDisplay value={f.fun_score} />
                      <p className="text-xs text-coc-muted mt-0.5">
                        {new Date(f.created_at).toLocaleDateString("ja-JP")}
                      </p>
                    </div>
                  </div>
                  {f.highlight && (
                    <div className="mt-2 border-t border-coc-border pt-2">
                      <p className="text-xs text-coc-muted mb-0.5">印象的な場面</p>
                      <p className="text-xs text-coc-text whitespace-pre-wrap">{f.highlight}</p>
                    </div>
                  )}
                  {f.improvement && (
                    <div className="mt-2 border-t border-coc-border pt-2">
                      <p className="text-xs text-coc-muted mb-0.5">改善提案</p>
                      <p className="text-xs text-coc-text whitespace-pre-wrap">{f.improvement}</p>
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
