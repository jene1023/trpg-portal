"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type Props = {
  scenarioId: string;
  scenarioTitle: string;
};

export default function ScenarioExportButton({ scenarioId, scenarioTitle }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    if (!isSupabaseConfigured) return;
    setLoading(true);
    try {
      const [
        { data: scenario },
        { data: handouts },
        { data: areas },
        { data: scenes },
        { data: bgmCues },
        { data: notes },
        { data: npcs },
        { data: plotThreads },
      ] = await Promise.all([
        supabase.from("scenarios").select("*").eq("id", scenarioId).single(),
        supabase.from("handouts").select("*").eq("scenario_id", scenarioId),
        supabase.from("scenario_areas").select("*").eq("scenario_id", scenarioId).order("order_index"),
        supabase.from("scenario_scenes").select("*").eq("scenario_id", scenarioId).order("scene_order"),
        supabase.from("bgm_cues").select("*").eq("scenario_id", scenarioId).order("order_index"),
        supabase.from("scenario_notes").select("*").eq("scenario_id", scenarioId).order("created_at"),
        supabase.from("npcs").select("*").eq("scenario_name", scenarioTitle),
        supabase.from("plot_threads").select("*").eq("scenario_id", scenarioId),
      ]);

      const exportData = {
        exportedAt: new Date().toISOString(),
        scenario,
        handouts: handouts ?? [],
        areas: areas ?? [],
        scenes: scenes ?? [],
        bgmCues: bgmCues ?? [],
        notes: notes ?? [],
        npcs: npcs ?? [],
        plotThreads: plotThreads ?? [],
      };

      const safeTitle = scenarioTitle.replace(/[^a-zA-Z0-9぀-鿿]/g, "_").slice(0, 40);
      const dateStr = new Date().toISOString().slice(0, 10);
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `scenario-${safeTitle}-${dateStr}.json`;
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
