export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import JournalClient from "./JournalClient";

type Props = { params: Promise<{ id: string }> };

export default async function JournalPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: char } = await supabase
    .from("characters")
    .select("id, name")
    .eq("id", id)
    .single();

  if (!char) notFound();

  const { data: entries } = await supabase
    .from("character_journal_entries")
    .select("*")
    .eq("character_id", id)
    .order("entry_date", { ascending: false, nullsFirst: false })
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
        日誌（In-character Journal）
      </h1>
      <p className="text-sm text-coc-muted mb-6">
        セッション後にキャラクター視点で記す内面記録。長期キャンペーンの成長弧を振り返る一次資料となります。
      </p>

      <JournalClient characterId={id} initialEntries={entries ?? []} />
    </div>
  );
}
