export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import SecretsClient from "./SecretsClient";

type Props = { params: Promise<{ id: string }> };

export default async function SecretsPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: char } = await supabase
    .from("characters")
    .select("id, name")
    .eq("id", id)
    .single();

  if (!char) notFound();

  const { data: secrets } = await supabase
    .from("character_secrets")
    .select("*")
    .eq("character_id", id)
    .order("created_at", { ascending: false });

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
        秘密メモ
      </h1>
      <p className="text-sm text-coc-muted mb-6">
        キャラクターだけが知る秘密の過去や、他のPCに隠している事実を記録します。KP共有フラグでKPのみへの開示も管理できます。
      </p>

      <SecretsClient characterId={id} initialSecrets={secrets ?? []} />
    </div>
  );
}
