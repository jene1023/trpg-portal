"use client";

import { useState } from "react";
import { Camera } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type Props = { characterId: string };

export default function SnapshotSaveButton({ characterId }: Props) {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [label, setLabel] = useState("");
  const [showForm, setShowForm] = useState(false);

  async function handleSave() {
    if (!isSupabaseConfigured) return;
    setLoading(true);
    try {
      const { data: char } = await supabase
        .from("characters")
        .select("*, character_skills(*)")
        .eq("id", characterId)
        .single();

      if (!char) return;

      const now = new Date().toISOString();
      const snapshotLabel = label.trim() || `スナップショット ${new Date(now).toLocaleString("ja-JP")}`;

      await supabase.from("character_snapshots").insert({
        character_id: characterId,
        label: snapshotLabel,
        snapshot_data: char,
        taken_at: now,
      });

      setSaved(true);
      setShowForm(false);
      setLabel("");
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setLoading(false);
    }
  }

  if (showForm) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-coc-border bg-coc-surface p-3">
        <p className="text-xs text-coc-muted font-semibold">スナップショットのラベル（省略可）</p>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="例: セッション5開始前"
          className="rounded-md border border-coc-border bg-coc-raised px-3 py-1.5 text-sm text-coc-text placeholder:text-coc-muted focus:outline-none focus:border-coc-gold/50"
        />
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 rounded-lg border border-coc-gold/50 bg-coc-gold/10 px-3 py-1.5 text-sm text-coc-gold hover:bg-coc-gold/20 transition-colors disabled:opacity-50"
          >
            {loading ? "保存中…" : "保存する"}
          </button>
          <button
            onClick={() => { setShowForm(false); setLabel(""); }}
            className="rounded-lg border border-coc-border px-3 py-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
          >
            キャンセル
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowForm(true)}
      className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-colors w-full ${
        saved
          ? "border-green-700 bg-green-950/20 text-green-300"
          : "border-coc-gold/40 bg-coc-gold/5 text-coc-gold hover:border-coc-gold/70 hover:bg-coc-gold/10"
      }`}
    >
      <Camera size={16} />
      {saved ? "スナップショット保存完了" : "スナップショットを保存"}
    </button>
  );
}
