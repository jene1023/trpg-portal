export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Coffee } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import DowntimeForm from "@/app/_components/DowntimeForm";

type Props = { params: Promise<{ id: string }> };

export default async function DowntimePage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: char } = await supabase
    .from("characters")
    .select("id, name")
    .eq("id", id)
    .single();

  if (!char) notFound();

  const { data: downtimes } = await supabase
    .from("character_downtime")
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

      <div className="flex items-center gap-2 mb-1">
        <Coffee size={20} className="text-coc-gold" />
        <h1 className="font-cinzel text-xl font-bold text-coc-text">ダウンタイム活動</h1>
      </div>
      <p className="text-sm text-coc-muted mb-6">
        セッション間の期間にキャラクターが行った調査・訓練・休養などを記録します。
      </p>

      <DowntimeForm characterId={id} initialDowntimes={downtimes ?? []} />
    </div>
  );
}
