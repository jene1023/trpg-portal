export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase, isSupabaseConfigured, Character, ScenarioParticipant } from "@/lib/supabase";
import ParticipantList from "@/app/_components/ParticipantList";

type CharacterSummary = Pick<Character, "id" | "name" | "player_name" | "occupation">;

type ParticipantWithCharacter = ScenarioParticipant & {
  characters: CharacterSummary;
};

type Props = { params: Promise<{ id: string }> };

export default async function ParticipantsPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: scenario } = await supabase
    .from("scenarios")
    .select("id, title")
    .eq("id", id)
    .single();

  if (!scenario) notFound();

  const { data: participants } = await supabase
    .from("scenario_participants")
    .select("*, characters(id, name, player_name, occupation)")
    .eq("scenario_id", id)
    .order("created_at", { ascending: true });

  const { data: allCharacters } = await supabase
    .from("characters")
    .select("id, name, player_name, occupation")
    .order("name", { ascending: true });

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
          参加キャラクター管理
        </h1>
      </div>

      <ParticipantList
        scenarioId={id}
        initialParticipants={(participants ?? []) as ParticipantWithCharacter[]}
        allCharacters={(allCharacters ?? []) as CharacterSummary[]}
      />
    </div>
  );
}
