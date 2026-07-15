"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Sparkles, Copy, Check } from "lucide-react";

export default function PreviouslyOnPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [narrative, setNarrative] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/previously-on", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId: id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "エラーが発生しました。");
      } else {
        setNarrative((data as { narrative: string }).narrative);
      }
    } catch {
      setError("通信エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!narrative) return;
    try {
      await navigator.clipboard.writeText(narrative);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement("textarea");
      el.value = narrative;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
        <h1 className="font-cinzel text-2xl font-bold text-coc-text mb-1">
          AI「前回のあらすじ」生成
        </h1>
        <p className="text-sm text-coc-muted">
          セッションログ・解決済み手がかり・プロットスレッドをもとに、次回セッション開幕時に読み上げるドラマチックなナレーションを生成します。
        </p>
      </div>

      {!narrative && (
        <div className="rounded-xl border border-coc-gold-dim bg-coc-raised px-5 py-8 text-center mb-6">
          <Sparkles size={32} className="text-coc-gold mx-auto mb-3" />
          <p className="text-sm text-coc-text mb-1">
            セッションログ・解決した手がかり・プロットの状況を分析し
          </p>
          <p className="text-sm text-coc-muted mb-5">
            DiscordやVTTのテキストチャンネルにそのままペーストできる台本形式で出力します。
          </p>
          <button
            onClick={generate}
            disabled={loading}
            className="rounded-lg bg-coc-gold px-6 py-2.5 text-sm font-semibold text-coc-bg hover:bg-coc-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "生成中…" : "前回のあらすじを生成する"}
          </button>
          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        </div>
      )}

      {narrative && (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-coc-gold-dim bg-coc-raised px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-coc-gold" />
                <h2 className="font-medium text-coc-gold">前回のあらすじ</h2>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 rounded-lg border border-coc-gold bg-coc-gold/10 px-3 py-1.5 text-xs font-medium text-coc-gold hover:bg-coc-gold/20 transition-colors"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "コピー済み" : "コピー"}
              </button>
            </div>
            <textarea
              readOnly
              value={narrative}
              rows={8}
              className="w-full rounded-lg border border-coc-border bg-coc-bg px-3 py-2 text-sm text-coc-text resize-none focus:outline-none"
            />
          </div>

          <button
            onClick={() => {
              setNarrative(null);
              setError(null);
            }}
            className="text-sm text-coc-muted hover:text-coc-text transition-colors self-center mt-2"
          >
            もう一度生成する
          </button>
        </div>
      )}
    </div>
  );
}
