"use client";

import { useState } from "react";
import { Gauge, Loader2, Check, ChevronDown, ChevronUp } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type DifficultyLabel = "beginner" | "intermediate" | "advanced";

type EvaluationResult = {
  difficulty_label: DifficultyLabel;
  reasoning: string;
  suggestions: string[];
};

const DIFFICULTY_LABELS: Record<DifficultyLabel, string> = {
  beginner: "初心者向け",
  intermediate: "中級",
  advanced: "上級",
};

const DIFFICULTY_COLORS: Record<DifficultyLabel, string> = {
  beginner: "text-green-400 border-green-800 bg-green-950/20",
  intermediate: "text-yellow-400 border-yellow-800 bg-yellow-950/20",
  advanced: "text-red-400 border-red-800 bg-red-950/20",
};

type Props = {
  scenarioId: string;
};

export default function ScenarioDifficultyEvaluator({ scenarioId }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [adopting, setAdopting] = useState(false);
  const [adopted, setAdopted] = useState(false);

  async function evaluate() {
    setError("");
    setLoading(true);
    setResult(null);
    setAdopted(false);
    try {
      const res = await fetch("/api/ai/scenario-difficulty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "評価に失敗しました。");
      } else {
        setResult(data.result);
      }
    } catch {
      setError("通信エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  }

  async function adoptDifficulty() {
    if (!result || !isSupabaseConfigured) return;
    setAdopting(true);
    try {
      await supabase
        .from("scenarios")
        .update({ difficulty: result.difficulty_label })
        .eq("id", scenarioId);
      setAdopted(true);
    } catch {
      setError("難易度の保存に失敗しました。");
    } finally {
      setAdopting(false);
    }
  }

  return (
    <div className="rounded-xl border border-coc-gold-dim bg-coc-raised px-5 py-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full"
      >
        <div className="flex items-center gap-3">
          <Gauge size={20} className="text-coc-gold" />
          <div className="text-left">
            <p className="font-medium text-coc-gold">難易度を自動評価（AI）</p>
            <p className="text-xs text-coc-muted">シーン・NPC・クリーチャーをもとにAIが初心者/中級/上級を判定</p>
          </div>
        </div>
        {open ? <ChevronUp size={16} className="text-coc-muted" /> : <ChevronDown size={16} className="text-coc-muted" />}
      </button>

      {open && (
        <div className="mt-4 space-y-3">
          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            onClick={evaluate}
            disabled={loading}
            className="flex items-center gap-2 rounded-md border border-coc-gold bg-coc-gold/10 px-4 py-2 text-sm font-medium text-coc-gold hover:bg-coc-gold/20 transition-colors disabled:opacity-40"
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                評価中…
              </>
            ) : (
              <>
                <Gauge size={15} />
                難易度を自動評価
              </>
            )}
          </button>

          {result && (
            <div className="space-y-3">
              <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold ${DIFFICULTY_COLORS[result.difficulty_label]}`}>
                {DIFFICULTY_LABELS[result.difficulty_label]}
              </div>

              <div className="rounded-lg border border-coc-border bg-coc-surface px-4 py-3 space-y-2">
                <p className="text-xs font-medium text-coc-muted uppercase tracking-widest">評価理由</p>
                <p className="text-sm text-coc-text leading-relaxed">{result.reasoning}</p>
              </div>

              {result.suggestions.length > 0 && (
                <div className="rounded-lg border border-coc-border bg-coc-surface px-4 py-3 space-y-2">
                  <p className="text-xs font-medium text-coc-muted uppercase tracking-widest">調整ヒント</p>
                  <ul className="space-y-1">
                    {result.suggestions.map((s, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-sm text-coc-text">
                        <span className="text-coc-gold mt-0.5">•</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={adoptDifficulty}
                disabled={adopting || adopted}
                className="flex items-center gap-2 rounded-md border border-coc-border px-3 py-1.5 text-xs text-coc-muted hover:text-coc-text hover:border-coc-gold transition-colors disabled:opacity-40"
              >
                {adopted ? (
                  <>
                    <Check size={13} className="text-green-400" />
                    難易度を採用済み
                  </>
                ) : adopting ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    保存中…
                  </>
                ) : (
                  <>
                    <Check size={13} />
                    この評価を採用
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
