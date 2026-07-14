export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase, isSupabaseConfigured, Handout } from "@/lib/supabase";
import HandoutList from "@/app/_components/HandoutList";

type Props = { params: Promise<{ id: string }> };

export type ParticipantInfo = { characterId: string; characterName: string };
export type ReadInfo = { handoutId: string; characterId: string };

export default async function HandoutsPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: scenario } = await supabase
    .from("scenarios")
    .select("id, title")
    .eq("id", id)
    .single();

  if (!scenario) notFound();

  const [{ data: handouts }, { data: participantsRaw }] = await Promise.all([
    supabase
      .from("handouts")
      .select("*")
      .eq("scenario_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("scenario_participants")
      .select("character_id, characters(id, name)")
      .eq("scenario_id", id),
  ]);

  const handoutIds = (handouts ?? []).map((h) => h.id);
  const { data: readsRaw } =
    handoutIds.length > 0
      ? await supabase
          .from("handout_reads")
          .select("handout_id, character_id")
          .in("handout_id", handoutIds)
      : { data: [] };

  const participants: ParticipantInfo[] = (participantsRaw ?? []).map((p) => {
    const char = p as unknown as {
      character_id: string;
      characters: { name: string } | null;
    };
    return {
      characterId: char.character_id,
      characterName: char.characters?.name ?? char.character_id,
    };
  });

  const initialReads: ReadInfo[] = (readsRaw ?? []).map((r) => ({
    handoutId: r.handout_id as string,
    characterId: r.character_id as string,
  }));

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/scenarios"
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          シナリオ一覧
        </Link>
      </div>

      <div className="mb-6">
        <p className="text-xs text-coc-muted mb-1">{scenario.title}</p>
        <h1 className="font-cinzel text-xl font-bold text-coc-text">
          ハンドアウト管理
        </h1>
      </div>

      <HandoutList
        scenarioId={id}
        initialHandouts={(handouts ?? []) as Handout[]}
        participants={participants}
        initialReads={initialReads}
      />
    </div>
  );
}
