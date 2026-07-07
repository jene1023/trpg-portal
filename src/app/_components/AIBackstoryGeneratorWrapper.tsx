"use client";

import { useState } from "react";
import { CharacterTrait, TraitType } from "@/lib/supabase";
import AIBackstoryGenerator from "./AIBackstoryGenerator";
import TraitsManager from "./TraitsManager";

type CharacterSummary = {
  id: string;
  name: string;
  occupation?: string | null;
  rule_edition?: "6th" | "7th" | null;
  str?: number | null;
  con?: number | null;
  pow?: number | null;
  dex?: number | null;
  app?: number | null;
  siz?: number | null;
  int_stat?: number | null;
  edu?: number | null;
};

type Props = {
  character: CharacterSummary;
  initialTraits: CharacterTrait[];
};

export default function AIBackstoryGeneratorWrapper({ character, initialTraits }: Props) {
  const [traits, setTraits] = useState<CharacterTrait[]>(initialTraits);

  function handleTraitAdded(trait: { id: string; character_id: string; trait_type: TraitType; content: string; created_at: string }) {
    setTraits((prev) => [...prev, trait as CharacterTrait]);
  }

  return (
    <>
      <AIBackstoryGenerator character={character} onTraitAdded={handleTraitAdded} />
      <TraitsManager characterId={character.id} traits={traits} onTraitsChange={setTraits} />
    </>
  );
}
