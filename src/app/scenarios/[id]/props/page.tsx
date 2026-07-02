export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package } from "lucide-react";
import { supabase, isSupabaseConfigured, ScenarioProp } from "@/lib/supabase";
import ScenarioPropList from "@/app/_components/ScenarioPropList";

type Props = { params: Promise<{ id: string }> };

export default async function ScenarioPropsPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: scenario } = await supabase
    .from("scenarios")
    .select("id, title")
    .eq("id", id)
    .single();

  if (!scenario) notFound();

  const { data: propsData } = await supabase
    .from("scenario_props")
    .select("*")
    .eq("scenario_id", id)
    .order("created_at", { ascending: true });

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

      <div className="flex items-center gap-2 mb-1">
        <Package size={20} className="text-coc-gold" />
        <h1 className="font-cinzel text-xl font-bold text-coc-text">物証・道具</h1>
      </div>
      <p className="text-xs text-coc-muted mb-1">{scenario.title}</p>
      <p className="text-xs text-coc-muted mb-6">
        シナリオ中に登場する物証・道具・プロップを管理し、配布状況を追跡します
      </p>

      <ScenarioPropList
        scenarioId={id}
        initialProps={(propsData ?? []) as ScenarioProp[]}
      />
    </div>
  );
}
