"use client";

import { useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Send } from "lucide-react";

type Props = {
  characterId: string;
  onPosted?: () => void;
};

export default function TributeForm({ characterId, onPosted }: Props) {
  const [authorName, setAuthorName] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured) return;
    if (!message.trim()) return;

    setSubmitting(true);
    setError(null);

    const { error: err } = await supabase.from("character_tributes").insert({
      character_id: characterId,
      author_name: authorName.trim() || "匿名",
      message: message.trim(),
    });

    setSubmitting(false);
    if (err) {
      setError("投稿に失敗しました。");
    } else {
      setSubmitted(true);
      setAuthorName("");
      setMessage("");
      onPosted?.();
      setTimeout(() => setSubmitted(false), 3000);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 mt-3">
      <input
        type="text"
        placeholder="お名前（省略可）"
        value={authorName}
        onChange={(e) => setAuthorName(e.target.value)}
        maxLength={60}
        className="w-full rounded border border-coc-border bg-coc-surface px-2 py-1.5 text-xs text-coc-text placeholder-coc-muted/50 focus:outline-none focus:border-coc-gold transition-colors"
      />
      <textarea
        placeholder="追悼メッセージを残す..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={300}
        rows={2}
        className="w-full rounded border border-coc-border bg-coc-surface px-2 py-1.5 text-xs text-coc-text placeholder-coc-muted/50 focus:outline-none focus:border-coc-gold transition-colors resize-none font-crimson"
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={submitting || !message.trim()}
        className="flex items-center gap-1.5 rounded border border-coc-border px-3 py-1.5 text-xs text-coc-muted hover:text-coc-gold hover:border-coc-gold transition-colors disabled:opacity-40"
      >
        <Send size={11} />
        {submitting ? "送信中..." : submitted ? "送信しました" : "追悼を投稿"}
      </button>
    </form>
  );
}
