"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type Props = {
  characterId: string;
  characterName: string;
};

export default function ExportButton({ characterId, characterName }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    if (!isSupabaseConfigured) return;
    setLoading(true);
    try {
      const { data: character } = await supabase
        .from("characters")
        .select("*")
        .eq("id", characterId)
        .single();

      const { data: skills } = await supabase
        .from("character_skills")
        .select("*")
        .eq("character_id", characterId);

      const { data: sessions } = await supabase
        .from("sessions")
        .select("*")
        .eq("character_id", characterId)
        .order("session_number", { ascending: true });

      const exportData = {
        exportedAt: new Date().toISOString(),
        character,
        skills: skills ?? [],
        sessions: sessions ?? [],
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${characterName}_export.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-1.5 rounded-lg border border-coc-border px-3 py-1.5 text-sm text-coc-muted hover:text-coc-text hover:border-coc-border-glow transition-colors disabled:opacity-50"
    >
      <Download size={14} />
      {loading ? "処理中…" : "エクスポート"}
    </button>
  );
}
