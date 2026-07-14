"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles, TrendingUp } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Character } from "@/lib/supabase";

type Recommendation = {
  skill_name: string;
  reason: string;
  expected_gain: number;
};

const RANK_LABELS = ["1位", "2位", "3位"];
const RANK_COLORS = [
  "border-coc-gold text-coc-gold",
  "border-blue-400 text-blue-400",
  "border-green-400 text-green-400",
];

export default function GrowthAdvisorPage() {
  const params = useParams();
  const id = params.id as string;

  const [char, setChar] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    supabase
      .from("characters")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        setChar(data ?? null);
        setLoading(false);
      });
  }, [id]);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setError(null);
    setRecommendations(null);
    try {
      const res = await fetch("/api/ai-growth-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId: id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "エラーが発生しました。");
      } else {
        setRecommendations(data.recommendations ?? []);
      }
    } catch {
      setError("通信エラーが発生しました。");
    } finally {
      setGenerating(false);
    }
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-coc-muted">読み込み中...</p>
      </div>
    );
  }

  if (!char) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-coc-muted">キャラクターが見つかりません。</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/characters/${id}/growth`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          技能成長グラフ
        </Link>
      </div>

      <div>
        <h1 className="font-cinzel text-xl font-bold text-coc-text flex items-center gap-2">
          <Sparkles size={20} className="text-coc-gold" />
          AI成長スキル推薦
        </h1>
        <p className="mt-1 text-sm text-coc-muted">
          {char.name} のダイスロール履歴とスキル一覧をAIが分析し、次セッションで成長させるべきスキルTOP3を推薦します。
        </p>
      </div>

      <button
        onClick={handleGenerate}
        disabled={generating}
        className="flex items-center gap-2 rounded-lg border border-coc-gold bg-coc-gold/10 px-5 py-2.5 text-sm font-semibold text-coc-gold hover:bg-coc-gold/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed motion-safe:active:scale-[0.97]"
      >
        <Sparkles size={15} />
        {generating ? "AI分析中..." : "スキル成長推薦を生成する"}
      </button>

      {error && (
        <div className="rounded-lg border border-red-700 bg-red-950/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {recommendations && recommendations.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest">
            推薦スキル TOP {recommendations.length}
          </h2>
          {recommendations.map((rec, i) => (
            <div
              key={i}
              className="rounded-lg border border-coc-border bg-coc-surface p-4 space-y-2"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`shrink-0 rounded border px-2 py-0.5 text-xs font-bold ${RANK_COLORS[i] ?? "border-coc-border text-coc-muted"}`}
                >
                  {RANK_LABELS[i] ?? `${i + 1}位`}
                </span>
                <span className="text-base font-semibold text-coc-text">{rec.skill_name}</span>
                {rec.expected_gain > 0 && (
                  <span className="ml-auto flex items-center gap-1 text-sm text-green-400 font-semibold shrink-0">
                    <TrendingUp size={14} />
                    +{rec.expected_gain}
                  </span>
                )}
              </div>
              <p className="text-sm text-coc-muted leading-relaxed">{rec.reason}</p>
            </div>
          ))}
        </div>
      )}

      {recommendations && recommendations.length === 0 && (
        <div className="rounded-lg border border-coc-border bg-coc-surface px-4 py-8 text-center text-sm text-coc-muted">
          推薦できるスキルが見つかりませんでした。
          <br />
          ダイスロール履歴やスキルデータを追加してから再度お試しください。
        </div>
      )}

      <div className="rounded-lg border border-coc-border/50 bg-coc-raised/30 px-4 py-3 text-xs text-coc-muted">
        ※ AIの推薦は参考情報です。実際の成長ロールはルールブックの手順に従って行ってください。
      </div>
    </div>
  );
}
