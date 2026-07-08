"use client";

import { useState } from "react";
import { supabase, isSupabaseConfigured, CharacterQuote } from "@/lib/supabase";

type Props = {
  characterId: string;
  initialQuotes: CharacterQuote[];
};

export default function QuotesClient({ characterId, initialQuotes }: Props) {
  const [quotes, setQuotes] = useState<CharacterQuote[]>(initialQuotes);
  const [quoteText, setQuoteText] = useState("");
  const [scenarioName, setScenarioName] = useState("");
  const [context, setContext] = useState("");
  const [sessionLabel, setSessionLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function addQuote() {
    if (!quoteText.trim()) return;
    if (!isSupabaseConfigured) return;
    setSaving(true);
    setError("");
    const { data, error: err } = await supabase
      .from("character_quotes")
      .insert({
        character_id: characterId,
        quote_text: quoteText.trim(),
        scenario_name: scenarioName.trim() || null,
        context: context.trim() || null,
        session_label: sessionLabel.trim() || null,
      })
      .select()
      .single();
    setSaving(false);
    if (err || !data) {
      setError("追加に失敗しました");
      return;
    }
    setQuotes((prev) => [data as CharacterQuote, ...prev]);
    setQuoteText("");
    setScenarioName("");
    setContext("");
    setSessionLabel("");
  }

  async function deleteQuote(quoteId: string) {
    if (!isSupabaseConfigured) return;
    await supabase.from("character_quotes").delete().eq("id", quoteId);
    setQuotes((prev) => prev.filter((q) => q.id !== quoteId));
  }

  return (
    <div className="space-y-6">
      {/* 追加フォーム */}
      <div className="rounded-lg border border-coc-border coc-card-bg p-4 space-y-3">
        <h2 className="text-sm font-semibold text-coc-muted uppercase tracking-widest">名セリフを追加</h2>
        <textarea
          placeholder="セリフ・決め台詞（例: 「恐怖には慣れた。問題は慣れすぎることだ」）"
          value={quoteText}
          onChange={(e) => setQuoteText(e.target.value)}
          rows={3}
          className="w-full rounded border border-coc-border bg-coc-void px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted/50 focus:outline-none focus:border-coc-gold/60 resize-none"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="シナリオ名（任意）"
            value={scenarioName}
            onChange={(e) => setScenarioName(e.target.value)}
            className="w-full rounded border border-coc-border bg-coc-void px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted/50 focus:outline-none focus:border-coc-gold/60"
          />
          <input
            type="text"
            placeholder="セッション回（任意）"
            value={sessionLabel}
            onChange={(e) => setSessionLabel(e.target.value)}
            className="w-full rounded border border-coc-border bg-coc-void px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted/50 focus:outline-none focus:border-coc-gold/60"
          />
        </div>
        <input
          type="text"
          placeholder="場面・状況（任意）"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          className="w-full rounded border border-coc-border bg-coc-void px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted/50 focus:outline-none focus:border-coc-gold/60"
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button
          onClick={addQuote}
          disabled={saving || !quoteText.trim()}
          className="rounded bg-coc-gold/20 border border-coc-gold/50 px-4 py-1.5 text-sm text-coc-gold hover:bg-coc-gold/30 transition-colors disabled:opacity-50"
        >
          {saving ? "追加中..." : "追加"}
        </button>
      </div>

      {/* 一覧 */}
      {quotes.length === 0 ? (
        <p className="text-center text-sm text-coc-muted py-8">名言がまだ登録されていません</p>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-coc-muted uppercase tracking-widest">
            語録一覧（{quotes.length}件）
          </h2>
          {quotes.map((quote) => (
            <QuoteCard key={quote.id} quote={quote} onDelete={deleteQuote} />
          ))}
        </div>
      )}
    </div>
  );
}

function QuoteCard({
  quote,
  onDelete,
}: {
  quote: CharacterQuote;
  onDelete: (id: string) => Promise<void>;
}) {
  return (
    <div className="rounded-lg border border-coc-border coc-card-bg p-4 space-y-2">
      <p className="font-crimson italic text-coc-gold text-base leading-relaxed border-l-2 border-coc-gold-dim pl-3 whitespace-pre-wrap">
        &ldquo;{quote.quote_text}&rdquo;
      </p>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-coc-muted">
        {quote.scenario_name && (
          <span>📖 {quote.scenario_name}</span>
        )}
        {quote.session_label && (
          <span>🎲 {quote.session_label}</span>
        )}
        {quote.context && (
          <span>— {quote.context}</span>
        )}
        <span className="ml-auto">
          {new Date(quote.created_at).toLocaleDateString("ja-JP")}
        </span>
      </div>
      <div className="flex justify-end pt-1">
        <button
          onClick={() => onDelete(quote.id)}
          className="rounded border border-red-900/40 px-2.5 py-1 text-xs text-red-500/60 hover:text-red-400 hover:border-red-800/60 transition-colors"
        >
          削除
        </button>
      </div>
    </div>
  );
}
