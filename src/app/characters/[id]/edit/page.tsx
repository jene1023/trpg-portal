export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import CharacterForm from "@/app/_components/CharacterForm";

type Props = { params: Promise<{ id: string }> };

export default async function EditCharacterPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: char } = await supabase
    .from("characters")
    .select("*")
    .eq("id", id)
    .single();

  if (!char) notFound();

  const { data: skills } = await supabase
    .from("character_skills")
    .select("*")
    .eq("character_id", id);

  return <CharacterForm initialData={char} initialSkills={skills ?? []} />;
}
