export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles, BookOpen } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import SpellForm from "@/app/_components/SpellForm";

type Props = { params: Promise<{ id: string }> };

export default async function SpellsPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: char } = await supabase
    .from("characters")
    .select("id, name")
    .eq("id", id)
    .single();

  if (!char) notFound();

  const { data: spells } = await supabase
    .from("character_spells")
    .select("*")
    .eq("character_id", id)
    .order("created_at", { ascending: true });

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

      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-coc-gold" />
          <h1 className="font-cinzel text-xl font-bold text-coc-text">呪文・魔術</h1>
        </div>
        <Link
          href={`/spells?characterId=${id}`}
          className="flex items-center gap-1.5 rounded-lg border border-coc-border bg-coc-surface px-3 py-1.5 text-xs text-coc-muted hover:text-coc-text hover:border-coc-gold transition-colors"
        >
          <BookOpen size={13} />
          カタログから追加
        </Link>
      </div>
      <p className="text-sm text-coc-muted mb-6">
        習得した呪文を管理します。MP・SAN消費・効果をセッション中に素早く参照できます。
      </p>

      <SpellForm characterId={id} initialSpells={spells ?? []} />
    </div>
  );
}
