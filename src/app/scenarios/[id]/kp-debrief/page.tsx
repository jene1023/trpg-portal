"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Sparkles, CheckCircle, AlertTriangle, Lightbulb } from "lucide-react";

type DebriefResult = {
  went_well: string[];
  improvements: string[];
  next_suggestions: string[];
};

export default function KpDebriefPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DebriefResult | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/kp-debrief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId: id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "エラーが発生しました。");
      } else {
        setResult(data as DebriefResult);
      }
    } catch {
      setError("通信エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="coc-page-enter mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/scenarios/${id}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          シナリオ詳細
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="font-cinzel text-2xl font-bold text-coc-text mb-1">AIデブリーフィング</h1>
        <p className="text-sm text-coc-muted">
          セッションデータをAIが分析し、KP向けの振り返りレポートを生成します。
        </p>
      </div>

      {!result && (
        <div className="rounded-xl border border-coc-gold-dim bg-coc-raised px-5 py-8 text-center mb-6">
          <Sparkles size={32} className="text-coc-gold mx-auto mb-3" />
          <p className="text-sm text-coc-text mb-1">SAN/HP喪失量・NPC遭遇記録・ダイス成功率・PL評価をもとに</p>
          <p className="text-sm text-coc-muted mb-5">
            うまくいった点・改善点・次回への提案を生成します。
          </p>
          <button
            onClick={generate}
            disabled={loading}
            className="rounded-lg bg-coc-gold px-6 py-2.5 text-sm font-semibold text-coc-bg hover:bg-coc-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "生成中…" : "レポートを生成する"}
          </button>
          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        </div>
      )}

      {result && (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-green-800 bg-green-950/20 px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={18} className="text-green-400" />
              <h2 className="font-medium text-green-400">うまくいった点</h2>
            </div>
            <ul className="flex flex-col gap-2">
              {result.went_well.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-coc-text">
                  <span className="text-green-400 mt-0.5 flex-shrink-0">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-yellow-800 bg-yellow-950/20 px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={18} className="text-yellow-400" />
              <h2 className="font-medium text-yellow-400">改善できる点</h2>
            </div>
            <ul className="flex flex-col gap-2">
              {result.improvements.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-coc-text">
                  <span className="text-yellow-400 mt-0.5 flex-shrink-0">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-coc-gold-dim bg-coc-raised px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb size={18} className="text-coc-gold" />
              <h2 className="font-medium text-coc-gold">次回セッションへの提案</h2>
            </div>
            <ul className="flex flex-col gap-2">
              {result.next_suggestions.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-coc-text">
                  <span className="text-coc-gold mt-0.5 flex-shrink-0 font-bold">{i + 1}.</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={() => { setResult(null); setError(null); }}
            className="text-sm text-coc-muted hover:text-coc-text transition-colors self-center mt-2"
          >
            もう一度生成する
          </button>
        </div>
      )}
    </div>
  );
}
