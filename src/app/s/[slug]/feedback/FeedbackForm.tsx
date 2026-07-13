"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type Props = {
  scenarioId: string;
  scenarioTitle: string;
};

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
          className={`text-2xl transition-colors ${
            star <= value ? "text-coc-gold" : "text-coc-border hover:text-coc-gold-dim"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function FeedbackForm({ scenarioId, scenarioTitle }: Props) {
  const [playerName, setPlayerName] = useState("");
  const [funScore, setFunScore] = useState(0);
  const [memorableScene, setMemorableScene] = useState("");
  const [improvement, setImprovement] = useState("");
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured || funScore === 0) return;
    setSaving(true);
    setError(null);

    const { error: insertError } = await supabase.from("player_feedback").insert({
      scenario_id: scenarioId,
      player_name: playerName.trim() || "匿名",
      fun_score: funScore,
      highlight: memorableScene.trim() || null,
      improvement: improvement.trim() || null,
    });

    if (insertError) {
      setError("送信に失敗しました。もう一度お試しください。");
    } else {
      setSubmitted(true);
    }
    setSaving(false);
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="rounded-2xl border border-coc-border bg-coc-surface px-6 py-8 text-center">
        <p className="text-coc-muted text-sm">システムが設定されていません。</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-coc-gold-dim bg-coc-surface px-6 py-7 shadow-lg">
      <p className="font-cinzel text-xs font-medium text-coc-muted uppercase tracking-widest mb-3">
        PLフィードバック
      </p>
      <h1 className="font-cinzel text-xl font-bold text-coc-text mb-1 leading-tight">
        {scenarioTitle}
      </h1>
      <p className="text-xs text-coc-muted mb-6">
        セッション後の感想をKPへ送信します。
      </p>

      {submitted ? (
        <div className="rounded-xl border border-green-800 bg-green-950/20 px-5 py-8 text-center">
          <p className="text-green-400 font-medium mb-1">フィードバックを送信しました</p>
          <p className="text-xs text-coc-muted">ご協力ありがとうございました！</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="text-xs text-coc-muted block mb-1">
              お名前・キャラクター名（任意）
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="省略すると「匿名」として送信されます"
              className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:border-coc-gold focus:outline-none"
            />
          </div>

          <div>
            <p className="text-xs text-coc-muted mb-2">
              楽しさ評価 <span className="text-red-400">*</span>
            </p>
            <StarInput value={funScore} onChange={setFunScore} />
          </div>

          <div>
            <label className="text-xs text-coc-muted block mb-1">
              印象的だった場面（任意）
            </label>
            <textarea
              value={memorableScene}
              onChange={(e) => setMemorableScene(e.target.value)}
              rows={3}
              placeholder="特に盛り上がった場面や、心に残ったシーンを教えてください"
              className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:border-coc-gold focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="text-xs text-coc-muted block mb-1">
              改善してほしい点（任意）
            </label>
            <textarea
              value={improvement}
              onChange={(e) => setImprovement(e.target.value)}
              rows={3}
              placeholder="次回のセッションに活かせるご意見があればお聞かせください"
              className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:border-coc-gold focus:outline-none resize-none"
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={saving || funScore === 0}
            className="flex items-center justify-center gap-2 rounded-xl border border-coc-gold-dim bg-coc-surface px-5 py-3 text-sm font-medium text-coc-gold transition-colors hover:border-coc-gold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={16} />
            {saving ? "送信中..." : "フィードバックを送る"}
          </button>
        </form>
      )}
    </div>
  );
}
