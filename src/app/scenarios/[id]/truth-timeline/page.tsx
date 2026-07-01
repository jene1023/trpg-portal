export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase, isSupabaseConfigured, ScenarioTimelineEvent } from "@/lib/supabase";
import TruthTimeline from "@/app/_components/TruthTimeline";

type Props = { params: Promise<{ id: string }> };

export default async function TruthTimelinePage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: scenario } = await supabase
    .from("scenarios")
    .select("id, title")
    .eq("id", id)
    .single();

  if (!scenario) notFound();

  const { data: events } = await supabase
    .from("scenario_timeline_events")
    .select("*")
    .eq("scenario_id", id)
    .order("event_order", { ascending: true });

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
        <h1 className="font-cinzel text-xl font-bold text-coc-text">真相タイムライン</h1>
        <p className="text-xs text-coc-muted mt-1">
          シナリオの事件経緯を時系列で整理します。目のアイコンでPLに明かされた情報をマークできます。
        </p>
      </div>

      <TruthTimeline
        scenarioId={id}
        initialEvents={(events ?? []) as ScenarioTimelineEvent[]}
      />
    </div>
  );
}
