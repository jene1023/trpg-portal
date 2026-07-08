"use client";

import { useState } from "react";
import { BookmarkPlus } from "lucide-react";
import { supabase, isSupabaseConfigured, Npc } from "@/lib/supabase";

type Props = { npc: Npc };

export default function NpcSaveAsPresetButton({ npc }: Props) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function handleSave() {
    if (!isSupabaseConfigured) return;
    setStatus("saving");
    const { error } = await supabase.from("npc_presets").insert({
      name: npc.name,
      occupation_name: npc.scenario_name ?? null,
      appearance: npc.appearance ?? null,
      purpose: npc.purpose ?? null,
      notes: npc.notes ?? null,
      str: npc.str ?? null,
      con: npc.con ?? null,
      pow: npc.pow ?? null,
      dex: npc.dex ?? null,
      app: npc.app ?? null,
      siz: npc.siz ?? null,
      int_stat: npc.int_stat ?? null,
      edu: npc.edu ?? null,
      hp: npc.hp ?? null,
      mp: npc.mp ?? null,
      db: npc.db ?? null,
    });
    if (error) {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    } else {
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  const label =
    status === "saving" ? "保存中…" :
    status === "saved" ? "保存済み" :
    status === "error" ? "エラー" :
    "プリセット保存";

  return (
    <button
      onClick={handleSave}
      disabled={status === "saving" || status === "saved"}
      className="flex items-center gap-1.5 rounded-lg border border-coc-border px-3 py-1.5 text-sm text-coc-muted hover:text-coc-text hover:border-coc-border-glow transition-colors disabled:opacity-50"
    >
      <BookmarkPlus size={14} />
      {label}
    </button>
  );
}
