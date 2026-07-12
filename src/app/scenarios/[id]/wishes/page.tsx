export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Heart } from "lucide-react";
import { supabase, isSupabaseConfigured, PlayerWish } from "@/lib/supabase";
import PlayerWishList from "@/app/_components/PlayerWishList";

type Props = { params: Promise<{ id: string }> };

export default async function PlayerWishesPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: scenario } = await supabase
    .from("scenarios")
    .select("id, title")
    .eq("id", id)
    .single();

  if (!scenario) notFound();

  const { data: wishes } = await supabase
    .from("player_wishes")
    .select("*")
    .eq("scenario_id", id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/scenarios/${id}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          シナリオ詳細
        </Link>
      </div>

      <div className="mb-6">
        <p className="text-xs text-coc-muted mb-1">{scenario.title}</p>
        <h1 className="font-cinzel text-xl font-bold text-coc-text flex items-center gap-2">
          <Heart size={20} className="text-coc-gold" />
          PLの期待リスト
        </h1>
        <p className="text-xs text-coc-muted mt-2">
          次セッションへの期待・行きたい場所・再会したいNPCをPLが投稿し、KPがセッション前に確認できます。
        </p>
      </div>

      <PlayerWishList
        scenarioId={id}
        initialWishes={(wishes ?? []) as PlayerWish[]}
      />
    </div>
  );
}
