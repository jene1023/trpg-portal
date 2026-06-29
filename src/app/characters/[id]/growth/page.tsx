export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import GrowthHistoryList from "@/app/_components/GrowthHistoryList";

type Props = { params: Promise<{ id: string }> };

export default async function GrowthPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: char } = await supabase
    .from("characters")
    .select("id, name")
    .eq("id", id)
    .single();

  if (!char) notFound();

  const { data: history } = await supabase
    .from("growth_history")
    .select("*")
    .eq("character_id", id)
    .order("grown_at", { ascending: false });

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
        技能成長履歴
      </h1>
      <p className="text-xs text-coc-muted mb-6">
        セッション後に技能値が上がった記録。セッション名を入力すると年表にも表示されます。
      </p>

      <GrowthHistoryList characterId={id} initialHistory={history ?? []} />
    </div>
  );
}
