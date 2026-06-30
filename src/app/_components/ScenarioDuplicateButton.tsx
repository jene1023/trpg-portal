"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type Props = { scenarioId: string };

export default function ScenarioDuplicateButton({ scenarioId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDuplicate() {
    if (!isSupabaseConfigured) return;
    setLoading(true);
    try {
      const { data: scenario } = await supabase
        .from("scenarios")
        .select("*")
        .eq("id", scenarioId)
        .single();

      if (!scenario) return;

      const { id: _id, created_at: _ca, ...scenarioFields } = scenario;

      const { data: newScenario, error: scenarioErr } = await supabase
        .from("scenarios")
        .insert({
          ...scenarioFields,
          title: `${scenarioFields.title}（コピー）`,
          status: "planning",
        })
        .select()
        .single();

      if (scenarioErr || !newScenario) return;

      const { data: npcs } = await supabase
        .from("npcs")
        .select("*")
        .eq("scenario_name", scenario.title);

      if (npcs && npcs.length > 0) {
        const newNpcs = npcs.map(
          ({ id: _nid, created_at: _nca, ...n }: { id: string; created_at?: string; [key: string]: unknown }) => ({
            ...n,
            scenario_name: newScenario.title,
          })
        );
        await supabase.from("npcs").insert(newNpcs);
      }

      const { data: handouts } = await supabase
        .from("handouts")
        .select("*")
        .eq("scenario_id", scenarioId);

      if (handouts && handouts.length > 0) {
        const newHandouts = handouts.map(
          ({ id: _hid, created_at: _hca, ...h }: { id: string; created_at?: string; [key: string]: unknown }) => ({
            ...h,
            scenario_id: newScenario.id,
          })
        );
        await supabase.from("handouts").insert(newHandouts);
      }

      router.push(`/scenarios/${newScenario.id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDuplicate}
      disabled={loading}
      className="flex items-center gap-1.5 rounded-lg border border-coc-border px-3 py-1.5 text-sm text-coc-muted hover:text-coc-text hover:border-coc-border-glow transition-colors disabled:opacity-50"
    >
      <Copy size={14} />
      {loading ? "複製中…" : "複製"}
    </button>
  );
}
