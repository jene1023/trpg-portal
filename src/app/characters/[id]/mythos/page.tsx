export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import MythosClient from "./MythosClient";

type Props = { params: Promise<{ id: string }> };

export default async function MythosPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: char } = await supabase
    .from("characters")
    .select("id, name")
    .eq("id", id)
    .single();

  if (!char) notFound();

  const { data: encounters } = await supabase
    .from("character_mythos_encounters")
    .select("*")
    .eq("character_id", id)
    .order("encountered_at", { ascending: false });

  const { data: creatures } = await supabase
    .from("creatures")
    .select("id, name")
    .order("name");

  return (
    <div className="coc-page-enter mx-auto max-w-2xl px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/characters/${id}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          {char.name} に戻る
        </Link>
      </div>

      <div>
        <h1 className="font-cinzel text-2xl font-bold text-coc-text coc-name-glow">神話遭遇記録</h1>
        <p className="text-sm text-coc-muted mt-1">{char.name}</p>
      </div>

      <MythosClient
        characterId={id}
        initialEncounters={encounters ?? []}
        creatures={creatures ?? []}
      />
    </div>
  );
}
