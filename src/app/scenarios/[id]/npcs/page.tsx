export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User } from "lucide-react";
import { supabase, isSupabaseConfigured, Npc } from "@/lib/supabase";
import ScenarioNpcManager from "@/app/_components/ScenarioNpcManager";

type Props = { params: Promise<{ id: string }> };

export default async function ScenarioNpcsPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: scenario } = await supabase
    .from("scenarios")
    .select("id, title")
    .eq("id", id)
    .single();

  if (!scenario) notFound();

  const { data: npcs } = await supabase
    .from("npcs")
    .select("*")
    .eq("scenario_name", scenario.title)
    .order("created_at", { ascending: true });

  return (
    <div className="coc-page-enter mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/scenarios/${id}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          {scenario.title}
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <User size={20} className="text-coc-gold" />
        <div>
          <p className="text-xs text-coc-muted">{scenario.title}</p>
          <h1 className="font-cinzel text-xl font-bold text-coc-text">
            NPC管理
          </h1>
        </div>
      </div>

      <ScenarioNpcManager
        scenarioId={id}
        scenarioName={scenario.title}
        initialNpcs={(npcs ?? []) as Npc[]}
      />
    </div>
  );
}
