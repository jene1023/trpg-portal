export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase, isSupabaseConfigured, PlotThread } from "@/lib/supabase";
import PlotThreadBoard from "@/app/_components/PlotThreadBoard";

type Props = { params: Promise<{ id: string }> };

export default async function PlotThreadsPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: scenario } = await supabase
    .from("scenarios")
    .select("id, title")
    .eq("id", id)
    .single();

  if (!scenario) notFound();

  const { data: threads } = await supabase
    .from("plot_threads")
    .select("*")
    .eq("scenario_id", id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
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
        <h1 className="font-cinzel text-xl font-bold text-coc-text">謎・伏線管理</h1>
        <p className="text-xs text-coc-muted mt-1">
          シナリオ内の未解明の謎・伏線・秘密を追跡します。ステータスボタンで「解明済み」「放棄」に移動できます。
        </p>
      </div>

      <PlotThreadBoard
        scenarioId={id}
        initialThreads={(threads ?? []) as PlotThread[]}
      />
    </div>
  );
}
