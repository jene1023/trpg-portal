export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import TraitsManager from "@/app/_components/TraitsManager";

type Props = { params: Promise<{ id: string }> };

export default async function TraitsPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: char } = await supabase
    .from("characters")
    .select("id, name")
    .eq("id", id)
    .single();

  if (!char) notFound();

  const { data: traits } = await supabase
    .from("character_traits")
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

      <h1 className="font-cinzel text-xl font-bold text-coc-text mb-2">
        特質・重要情報
      </h1>
      <p className="text-sm text-coc-muted mb-6">
        CoC7版の「重要な人物」「大切な宝物」「性格的特質」などをカテゴリ別に記録します。
      </p>

      <TraitsManager characterId={id} initialTraits={traits ?? []} />
    </div>
  );
}
