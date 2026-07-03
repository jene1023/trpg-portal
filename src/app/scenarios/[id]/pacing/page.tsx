export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase, isSupabaseConfigured, ScenePacingLog } from "@/lib/supabase";
import ScenePacingList from "@/app/_components/ScenePacingList";

type Props = { params: Promise<{ id: string }> };

export default async function ScenePacingPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: scenario } = await supabase
    .from("scenarios")
    .select("id, title")
    .eq("id", id)
    .single();

  if (!scenario) notFound();

  const { data: logs } = await supabase
    .from("scene_pacing_logs")
    .select("*")
    .eq("scenario_id", id)
    .order("started_at", { ascending: true });

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
        <h1 className="font-cinzel text-xl font-bold text-coc-text">ペーシングログ</h1>
        <p className="text-xs text-coc-muted mt-1">各シーンの開始・終了時刻を記録してセッションの時間管理に活用します</p>
      </div>

      <ScenePacingList
        scenarioId={id}
        initialLogs={(logs ?? []) as ScenePacingLog[]}
      />
    </div>
  );
}
