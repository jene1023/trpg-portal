"use client";

import { useState } from "react";
import { Sparkles, Save, X } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type Props = {
  sessionId: string;
  characterId: string;
  onSummaryUpdated?: (newSummary: string) => void;
};

export default function SessionSummaryGenerator({
  sessionId,
  characterId,
  onSummaryUpdated,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/session-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, characterId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "生成に失敗しました");
      setGenerated(data.summary ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  async function saveSummary() {
    if (!isSupabaseConfigured || !generated.trim()) return;
    setSaving(true);
    try {
      const { error: err } = await supabase
        .from("sessions")
        .update({ summary: generated.trim() })
        .eq("id", sessionId);
      if (err) throw err;
      onSummaryUpdated?.(generated.trim());
      setIsOpen(false);
      setGenerated("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => { setIsOpen(true); generate(); }}
        className="inline-flex items-center gap-1 text-xs text-coc-muted hover:text-coc-gold transition-colors"
      >
        <Sparkles size={12} />
        AIでまとめを生成
      </button>
    );
  }

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-coc-muted flex items-center gap-1">
          <Sparkles size={12} />
          AI生成サマリー
        </span>
        <button
          onClick={() => { setIsOpen(false); setGenerated(""); setError(null); }}
          className="text-coc-muted hover:text-coc-text transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {loading ? (
        <p className="text-xs text-coc-muted py-2">生成中...</p>
      ) : error ? (
        <div className="space-y-1">
          <p className="text-xs text-red-400">{error}</p>
          <button
            onClick={generate}
            className="text-xs text-coc-gold hover:brightness-125 transition-all"
          >
            再試行
          </button>
        </div>
      ) : (
        <>
          <textarea
            value={generated}
            onChange={(e) => setGenerated(e.target.value)}
            rows={5}
            className="w-full rounded border border-coc-border bg-coc-bg text-coc-text text-sm p-2 resize-y focus:outline-none focus:border-coc-gold"
          />
          <div className="flex gap-2">
            <button
              onClick={saveSummary}
              disabled={saving || !generated.trim()}
              className="inline-flex items-center gap-1 text-xs bg-coc-gold text-coc-bg px-3 py-1 rounded hover:brightness-110 transition-all disabled:opacity-50"
            >
              <Save size={12} />
              {saving ? "保存中..." : "このサマリーで更新"}
            </button>
            <button
              onClick={generate}
              className="text-xs text-coc-muted hover:text-coc-gold transition-colors"
            >
              再生成
            </button>
          </div>
        </>
      )}
    </div>
  );
}
