export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase, isSupabaseConfigured, ScenarioScene } from "@/lib/supabase";
import ScenarioSceneList from "@/app/_components/ScenarioSceneList";

type Props = { params: Promise<{ id: string }> };

export default async function ScenarioAgendaPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: scenario } = await supabase
    .from("scenarios")
    .select("id, title")
    .eq("id", id)
    .single();

  if (!scenario) notFound();

  const { data: scenes } = await supabase
    .from("scenario_scenes")
    .select("*")
    .eq("scenario_id", id)
    .order("scene_order", { ascending: true });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/scenarios/${id}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          シナリオ詳細
        </Link>
      </div>

      <div className="mb-6">
        <p className="text-xs text-coc-muted mb-1">{scenario.title}</p>
        <h1 className="font-cinzel text-xl font-bold text-coc-text">セッションアジェンダ</h1>
        <p className="text-xs text-coc-muted mt-1">場面単位でセッションの流れを計画・進行管理します</p>
      </div>

      <ScenarioSceneList
        scenarioId={id}
        initialScenes={(scenes ?? []) as ScenarioScene[]}
      />
    </div>
  );
}
