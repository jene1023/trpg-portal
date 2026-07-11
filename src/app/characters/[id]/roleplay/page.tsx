export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import RoleplayChat from "@/app/_components/RoleplayChat";

type Props = { params: Promise<{ id: string }> };

export default async function RoleplayPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: char } = await supabase
    .from("characters")
    .select("id, name, occupation, background, speech_style")
    .eq("id", id)
    .single();

  if (!char) notFound();

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

      <h1 className="font-cinzel text-xl font-bold text-coc-text mb-1">
        ロールプレイシミュレーター
      </h1>
      <p className="text-xs text-coc-muted mb-2">
        {char.name}{char.occupation ? `（${char.occupation}）` : ""} としてAI GMと対話練習
      </p>
      <p className="text-xs text-coc-muted mb-6 leading-relaxed">
        セッション本番前にキャラクターの「声」を掴むための練習ツールです。
        探索者として話しかけると、GMがCoC世界観で応答します。
      </p>

      {char.speech_style && (
        <div className="rounded-lg border border-coc-border bg-coc-surface px-4 py-3 mb-6">
          <p className="text-xs text-coc-muted mb-1">口調・ロールプレイメモ</p>
          <p className="text-sm text-coc-text whitespace-pre-wrap leading-relaxed">
            {char.speech_style}
          </p>
        </div>
      )}

      <RoleplayChat characterId={id} characterName={char.name} />
    </div>
  );
}
