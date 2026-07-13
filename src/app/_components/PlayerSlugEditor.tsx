"use client";

import { useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type Props = {
  characterId: string;
  initialSlug: string | null;
};

export default function PlayerSlugEditor({ characterId, initialSlug }: Props) {
  const [slug, setSlug] = useState(initialSlug ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!isSupabaseConfigured) return;
    const trimmed = slug.trim();
    if (!trimmed) {
      setError("スラッグを入力してください");
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      setError("英数字・ハイフン・アンダースコアのみ使用できます");
      return;
    }
    setError("");
    setSaving(true);
    const { error: supabaseError } = await supabase
      .from("characters")
      .update({ player_name: trimmed })
      .eq("id", characterId);
    setSaving(false);
    if (supabaseError) {
      setError("保存に失敗しました");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-coc-muted">
        ポートフォリオURL:&ensp;
        <span className="font-mono text-coc-text">
          /player/
          <span className="text-coc-gold">{slug || "あなたのスラッグ"}</span>
        </span>
      </p>
      <p className="text-xs text-coc-muted">
        このキャラクターが公開設定のとき、同じスラッグを持つキャラクターが一覧されます。英数字・ハイフン・アンダースコアが使えます。
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="your-slug"
          className="flex-1 rounded border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted/50 focus:outline-none focus:border-coc-gold/60"
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded bg-coc-gold/20 border border-coc-gold/40 px-4 py-2 text-sm text-coc-gold hover:bg-coc-gold/30 transition-colors disabled:opacity-50"
        >
          {saving ? "保存中…" : "保存"}
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {!saving && !error && saved && (
        <p className="text-xs text-green-400">保存しました</p>
      )}
    </div>
  );
}
