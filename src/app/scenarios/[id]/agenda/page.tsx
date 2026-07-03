export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ListChecks, Clapperboard } from "lucide-react";
import { supabase, isSupabaseConfigured, ScenarioScene, SessionAgendaItem } from "@/lib/supabase";
import ScenarioSceneList from "@/app/_components/ScenarioSceneList";
import SessionAgendaChecklist from "@/app/_components/SessionAgendaChecklist";

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

  const [{ data: agendaItems }, { data: scenes }] = await Promise.all([
    supabase
      .from("session_agenda_items")
      .select("*")
      .eq("scenario_id", id)
      .order("order_index", { ascending: true }),
    supabase
      .from("scenario_scenes")
      .select("*")
      .eq("scenario_id", id)
      .order("scene_order", { ascending: true }),
  ]);

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

      <div className="mb-8">
        <p className="text-xs text-coc-muted mb-1">{scenario.title}</p>
        <h1 className="font-cinzel text-xl font-bold text-coc-text">セッションアジェンダ</h1>
      </div>

      <section className="mb-10">
        <div className="flex items-center gap-2 mb-2">
          <ListChecks size={18} className="text-coc-gold" />
          <h2 className="font-cinzel text-xs font-semibold text-coc-gold uppercase tracking-widest">
            進行チェックリスト
          </h2>
        </div>
        <p className="text-xs text-coc-muted mb-4">
          セッション当日の「必達シーン」「配布ハンドアウト」「登場NPC」「リマインド事項」をチェックして消し込みします
        </p>
        <SessionAgendaChecklist
          scenarioId={id}
          initialItems={(agendaItems ?? []) as SessionAgendaItem[]}
        />
      </section>

      <section>
        <div className="flex items-center gap-2 mb-2">
          <Clapperboard size={18} className="text-coc-gold" />
          <h2 className="font-cinzel text-xs font-semibold text-coc-gold uppercase tracking-widest">
            場面プランナー
          </h2>
        </div>
        <p className="text-xs text-coc-muted mb-4">
          場面単位でセッションの流れを事前計画します
        </p>
        <ScenarioSceneList
          scenarioId={id}
          initialScenes={(scenes ?? []) as ScenarioScene[]}
        />
      </section>
    </div>
  );
}
