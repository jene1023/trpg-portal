"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type Props = { templateId: string; templateTitle: string };

export default function TemplateCloneButton({ templateId, templateTitle }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClone() {
    if (!isSupabaseConfigured) return;
    setLoading(true);
    try {
      const { data: scenario } = await supabase
        .from("scenarios")
        .select("*")
        .eq("id", templateId)
        .single();

      if (!scenario) return;

      const { id: _id, created_at: _ca, is_template: _it, template_published_at: _tpa, ...scenarioFields } = scenario;

      const { data: newScenario, error: scenarioErr } = await supabase
        .from("scenarios")
        .insert({
          ...scenarioFields,
          title: `${templateTitle}のコピー`,
          status: "planning",
          is_template: false,
          template_published_at: null,
        })
        .select()
        .single();

      if (scenarioErr || !newScenario) return;

      const [{ data: handouts }, { data: creatures }, { data: areas }] = await Promise.all([
        supabase.from("handouts").select("*").eq("scenario_id", templateId),
        supabase.from("creatures").select("*").eq("scenario_id", templateId),
        supabase.from("scenario_areas").select("*").eq("scenario_id", templateId),
      ]);

      await Promise.all([
        handouts && handouts.length > 0
          ? supabase.from("handouts").insert(
              handouts.map(({ id: _hid, created_at: _hca, ...h }: { id: string; created_at?: string; [key: string]: unknown }) => ({
                ...h,
                scenario_id: newScenario.id,
                is_distributed: false,
              }))
            )
          : Promise.resolve(),
        creatures && creatures.length > 0
          ? supabase.from("creatures").insert(
              creatures.map(({ id: _cid, created_at: _cca, ...c }: { id: string; created_at?: string; [key: string]: unknown }) => ({
                ...c,
                scenario_id: newScenario.id,
              }))
            )
          : Promise.resolve(),
        areas && areas.length > 0
          ? supabase.from("scenario_areas").insert(
              areas.map(({ id: _aid, created_at: _aca, ...a }: { id: string; created_at?: string; [key: string]: unknown }) => ({
                ...a,
                scenario_id: newScenario.id,
              }))
            )
          : Promise.resolve(),
      ]);

      router.push(`/scenarios/${newScenario.id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClone}
      disabled={loading}
      className="flex items-center gap-1.5 rounded-lg border border-coc-gold bg-coc-gold/10 px-4 py-2 text-sm font-medium text-coc-gold hover:bg-coc-gold/20 transition-colors disabled:opacity-50"
    >
      <Copy size={15} />
      {loading ? "複製中…" : "このテンプレートを複製"}
    </button>
  );
}
