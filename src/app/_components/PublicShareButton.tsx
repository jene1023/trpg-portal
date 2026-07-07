"use client";

import { useState } from "react";
import { Link2, Link2Off, Copy, Check } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type Props = {
  characterId: string;
  publicToken: string | null;
};

export default function PublicShareButton({ characterId, publicToken: initialToken }: Props) {
  const [token, setToken] = useState(initialToken);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const publicUrl = token
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/public/characters/${token}`
    : "";

  async function handleGenerate() {
    if (!isSupabaseConfigured) return;
    setLoading(true);
    try {
      const newToken = crypto.randomUUID();
      const { error } = await supabase
        .from("characters")
        .update({ public_token: newToken })
        .eq("id", characterId);
      if (!error) setToken(newToken);
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke() {
    if (!isSupabaseConfigured) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("characters")
        .update({ public_token: null })
        .eq("id", characterId);
      if (!error) setToken(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!token) {
    return (
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-lg border border-coc-border px-3 py-1.5 text-sm text-coc-muted hover:text-coc-text hover:border-coc-border-glow transition-colors disabled:opacity-50"
      >
        <Link2 size={14} />
        {loading ? "生成中…" : "公開URLを生成"}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 rounded-lg border border-green-700 bg-green-950/20 px-3 py-1.5 text-sm text-green-400 hover:border-green-600 hover:text-green-300 transition-colors"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? "コピー完了" : "キャラシートURLをコピー"}
      </button>
      <button
        onClick={handleRevoke}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-lg border border-coc-border px-2 py-1.5 text-sm text-coc-muted hover:text-red-400 hover:border-red-800 transition-colors disabled:opacity-50"
        title="公開URLを無効化"
      >
        <Link2Off size={14} />
      </button>
    </div>
  );
}
