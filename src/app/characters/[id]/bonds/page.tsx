export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import BondsClient from "./BondsClient";

type Props = { params: Promise<{ id: string }> };

export default async function BondsPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: char } = await supabase
    .from("characters")
    .select("id, name")
    .eq("id", id)
    .single();

  if (!char) notFound();

  const { data: bonds } = await supabase
    .from("character_bonds")
    .select("*")
    .eq("character_id", id)
    .order("created_at", { ascending: true });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <Link
          href={`/characters/${id}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          {char.name} に戻る
        </Link>
      </div>

      <h1 className="font-cinzel text-2xl font-bold text-coc-text mb-2">
        絆（Bonds）
      </h1>
      <p className="text-sm text-coc-muted mb-6">
        CoC7版の「絆」ルール。重要な人物との絆スコアを管理し、SANロス時の回復や絆へのダメージを追跡します。有効絆値 = 絆スコア − ダメージ。
      </p>

      <BondsClient characterId={id} initialBonds={bonds ?? []} />
    </div>
  );
}
