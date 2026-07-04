export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookMarked, Sparkles } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import TomeForm from "@/app/_components/TomeForm";

type Props = { params: Promise<{ id: string }> };

export default async function TomesPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: char } = await supabase
    .from("characters")
    .select("id, name")
    .eq("id", id)
    .single();

  if (!char) notFound();

  const { data: tomes } = await supabase
    .from("character_tomes")
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
          <BookMarked size={20} className="text-coc-gold" />
          <h1 className="font-cinzel text-xl font-bold text-coc-text">魔道書コレクション</h1>
        </div>
        <Link
          href={`/characters/${id}/spells`}
          className="flex items-center gap-1.5 rounded-lg border border-coc-border bg-coc-surface px-3 py-1.5 text-xs text-coc-muted hover:text-coc-text hover:border-coc-gold transition-colors"
        >
          <Sparkles size={13} />
          習得呪文を見る
        </Link>
      </div>
      <p className="text-sm text-coc-muted mb-6">
        入手・読了した魔道書を管理します。SAN喪失・神話技能上昇・収録呪文をセッション中に参照できます。
      </p>

      <TomeForm characterId={id} initialTomes={tomes ?? []} />
    </div>
  );
}
