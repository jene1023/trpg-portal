"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type Props = {
  scenarioId: string;
};

export default function SessionPackShareButton({ scenarioId }: Props) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleShare() {
    if (!isSupabaseConfigured) return;
    setLoading(true);
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from("share_tokens")
      .insert({
        scenario_id: scenarioId,
        target_type: "session_pack",
        expires_at: expiresAt,
      })
      .select()
      .single();
    if (!error && data) {
      const url = `${window.location.origin}/share/${(data as { token: string }).token}`;
      setShareUrl(url);
      await navigator.clipboard.writeText(url).catch(() => {});
    }
    setLoading(false);
  }

  return (
    <div>
      <button
        onClick={handleShare}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-lg border border-coc-gold-dim bg-coc-raised px-3 py-2 text-sm text-coc-gold hover:bg-coc-surface hover:border-coc-gold transition-colors disabled:opacity-50"
      >
        <Share2 size={15} />
        {loading ? "生成中..." : "情報パックを共有"}
      </button>
      {shareUrl && (
        <div className="mt-2 rounded-md border border-coc-gold-dim bg-coc-raised px-3 py-2">
          <p className="text-xs text-coc-muted mb-1">
            共有リンク（72時間有効・クリップボードにコピー済み）
          </p>
          <p className="text-xs text-coc-gold break-all select-all">{shareUrl}</p>
        </div>
      )}
    </div>
  );
}
