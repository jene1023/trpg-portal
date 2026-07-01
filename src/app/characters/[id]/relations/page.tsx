export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import RelationList from "@/app/_components/RelationList";

type Props = { params: Promise<{ id: string }> };

export default async function RelationsPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: char } = await supabase
    .from("characters")
    .select("id, name")
    .eq("id", id)
    .single();

  if (!char) notFound();

  const { data: relations } = await supabase
    .from("character_relations")
    .select("*")
    .eq("character_id", id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/characters/${id}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          {char.name}
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="font-cinzel text-xl font-bold text-coc-text">
          関係メモ
        </h1>
        <Link
          href={`/characters/${id}/relation-graph`}
          className="flex items-center gap-1.5 rounded-lg border border-coc-border px-3 py-1.5 text-sm text-coc-muted hover:text-coc-text hover:border-coc-border-glow transition-colors"
        >
          相関図を見る →
        </Link>
      </div>

      <RelationList characterId={id} initialRelations={relations ?? []} />
    </div>
  );
}
