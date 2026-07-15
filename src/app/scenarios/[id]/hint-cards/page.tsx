"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Lightbulb, Eye, Loader2 } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type HintCard = {
  level: number;
  label: string;
  text: string;
};

const LEVEL_STYLES: Record<number, { border: string; labelColor: string; iconColor: string }> = {
  1: { border: "border-blue-800 bg-blue-950/20", labelColor: "text-blue-400", iconColor: "text-blue-400" },
  2: { border: "border-yellow-800 bg-yellow-950/20", labelColor: "text-yellow-400", iconColor: "text-yellow-400" },
  3: { border: "border-coc-gold-dim bg-coc-raised", labelColor: "text-coc-gold", iconColor: "text-coc-gold" },
};

export default function HintCardsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hints, setHints] = useState<HintCard[] | null>(null);
  const [disclosed, setDisclosed] = useState<Record<number, boolean>>({});
  const [disclosing, setDisclosing] = useState<Record<number, boolean>>({});

  async function generate() {
    setLoading(true);
    setError(null);
    setHints(null);
    setDisclosed({});
    try {
      const res = await fetch("/api/ai/hint-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId: id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "エラーが発生しました。");
      } else {
        setHints((data as { hints: HintCard[] }).hints);
      }
    } catch {
      setError("通信エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  }

  async function disclose(hint: HintCard) {
    if (!isSupabaseConfigured) return;
    setDisclosing((prev) => ({ ...prev, [hint.level]: true }));
    await supabase.from("scenario_broadcasts").insert({
      scenario_id: id,
      sender_character_id: null,
      title: `💡 ヒントカード ${hint.label}`,
      body: hint.text,
    });
    setDisclosing((prev) => ({ ...prev, [hint.level]: false }));
    setDisclosed((prev) => ({ ...prev, [hint.level]: true }));
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
        <h1 className="font-cinzel text-2xl font-bold text-coc-text mb-1 flex items-center gap-2">
          <Lightbulb size={24} className="text-coc-gold" />
          ヒントカード生成
        </h1>
        <p className="text-sm text-coc-muted">
          行き詰まったPLに見せるヒントを段階的に3段階で生成します。KP専用ツールです。
        </p>
      </div>

      {!isSupabaseConfigured && (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4 text-sm text-coc-muted text-center">
          Supabase が設定されていないため、この機能は利用できません。
        </div>
      )}

      {isSupabaseConfigured && !hints && (
        <div className="rounded-xl border border-coc-gold-dim bg-coc-raised px-5 py-8 text-center mb-6">
          <Lightbulb size={32} className="text-coc-gold mx-auto mb-3" />
          <p className="text-sm text-coc-text mb-1">解決済み手がかり・達成目標・訪問済みロケーションをもとに</p>
          <p className="text-sm text-coc-muted mb-5">
            PLが行き詰まったときに段階的に開示できるヒントカードを生成します。
          </p>
          <button
            onClick={generate}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-coc-gold px-6 py-2.5 text-sm font-semibold text-coc-bg hover:bg-coc-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {loading ? "生成中…" : "ヒントカードを生成する"}
          </button>
          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        </div>
      )}

      {hints && (
        <div className="flex flex-col gap-4">
          {hints.map((hint) => {
            const style = LEVEL_STYLES[hint.level] ?? LEVEL_STYLES[3];
            const isDisclosed = disclosed[hint.level];
            const isDisclosing = disclosing[hint.level];
            return (
              <div key={hint.level} className={`rounded-xl border px-5 py-4 ${style.border}`}>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Lightbulb size={18} className={style.iconColor} />
                    <h2 className={`font-medium ${style.labelColor}`}>{hint.label}</h2>
                  </div>
                  {isDisclosed ? (
                    <span className="flex items-center gap-1 text-xs text-green-400 font-medium">
                      <Eye size={13} />
                      PLに開示済み
                    </span>
                  ) : (
                    <button
                      onClick={() => disclose(hint)}
                      disabled={isDisclosing}
                      className="flex items-center gap-1.5 rounded-lg border border-coc-border bg-coc-surface px-3 py-1.5 text-xs font-medium text-coc-text hover:border-coc-gold hover:text-coc-gold transition-colors disabled:opacity-50"
                    >
                      {isDisclosing ? <Loader2 size={11} className="animate-spin" /> : <Eye size={11} />}
                      {isDisclosing ? "送信中…" : "このカードをPLに開示する"}
                    </button>
                  )}
                </div>
                <p className="text-sm text-coc-text leading-relaxed">{hint.text}</p>
              </div>
            );
          })}

          <button
            onClick={() => { setHints(null); setError(null); setDisclosed({}); }}
            className="text-sm text-coc-muted hover:text-coc-text transition-colors self-center mt-2"
          >
            もう一度生成する
          </button>
        </div>
      )}
    </div>
  );
}
