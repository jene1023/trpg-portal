"use client";

import { useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type Props = {
  characterId: string;
};

export default function StatSnapshotSaveButton({ characterId }: Props) {
  const [sessionLabel, setSessionLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState(false);

  async function handleSave() {
    if (!isSupabaseConfigured) return;
    setSaving(true);
    setErr(false);

    const { data: char } = await supabase
      .from("characters")
      .select("hp_current, san_current, luck")
      .eq("id", characterId)
      .single();

    if (char) {
      const { error } = await supabase.from("character_stat_snapshots").insert({
        character_id: characterId,
        session_label: sessionLabel.trim() || null,
        hp_current: char.hp_current,
        san_current: char.san_current,
        luck: char.luck,
        snapshot_at: new Date().toISOString(),
      });
      if (!error) {
        setSaved(true);
        setSessionLabel("");
        setTimeout(() => setSaved(false), 3000);
      } else {
        setErr(true);
      }
    } else {
      setErr(true);
    }
    setSaving(false);
  }

  return (
    <div className="space-y-1.5">
      <input
        type="text"
        value={sessionLabel}
        onChange={(e) => setSessionLabel(e.target.value)}
        placeholder="セッション名（任意）"
        className="w-full rounded-md border border-coc-border bg-coc-void px-3 py-1.5 text-xs text-coc-text placeholder:text-coc-muted focus:outline-none focus:border-coc-gold"
      />
      <button
        onClick={handleSave}
        disabled={saving || saved}
        className="w-full rounded-md border border-coc-border bg-coc-raised px-3 py-1.5 text-xs text-coc-muted hover:text-coc-text hover:border-coc-border-glow transition-colors disabled:opacity-50"
      >
        {saved ? "✓ 保存しました" : saving ? "保存中…" : "現在値をスナップショット保存"}
      </button>
      {err && <p className="text-xs text-red-400">保存に失敗しました</p>}
    </div>
  );
}
