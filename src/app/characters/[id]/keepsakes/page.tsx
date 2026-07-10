export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import KeepsakesClient from "./KeepsakesClient";

type Props = { params: Promise<{ id: string }> };

export default async function KeepsakesPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: char } = await supabase
    .from("characters")
    .select("id, name")
    .eq("id", id)
    .single();

  if (!char) notFound();

  const { data: keepsakes } = await supabase
    .from("character_keepsakes")
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
        記念品コレクション
      </h1>
      <p className="text-sm text-coc-muted mb-6">
        死亡したNPCの形見・呪われた遺物・特別な縁で手に入れたアイテム等、物語的意義が大きい「思い出の品」を記録します。
      </p>

      <KeepsakesClient characterId={id} initialKeepsakes={keepsakes ?? []} />
    </div>
  );
}
