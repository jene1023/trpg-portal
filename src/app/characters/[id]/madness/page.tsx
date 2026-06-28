export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import MadnessList from "@/app/_components/MadnessList";

type Props = { params: Promise<{ id: string }> };

export default async function MadnessPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: char } = await supabase
    .from("characters")
    .select("id, name, san_current, san_max")
    .eq("id", id)
    .single();

  if (!char) notFound();

  const { data: records } = await supabase
    .from("madness_records")
    .select("*")
    .eq("character_id", id)
    .order("created_at", { ascending: false });

  const activeCount = (records ?? []).filter((r) => r.is_active).length;

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

      <div className="flex items-center gap-3 mb-6">
        <h1 className="font-cinzel text-xl font-bold text-coc-text">
          狂気記録
        </h1>
        {activeCount > 0 && (
          <span className="rounded bg-red-900/60 border border-red-700 px-2 py-0.5 text-xs text-red-300 font-semibold">
            発症中 {activeCount}件
          </span>
        )}
      </div>

      <div className="rounded-lg border border-coc-border bg-coc-surface p-3 mb-6 flex justify-between items-center text-sm">
        <span className="text-coc-muted">現在SAN</span>
        <span className="font-bold text-coc-text">
          {char.san_current} / {char.san_max}
        </span>
      </div>

      <MadnessList characterId={id} initialRecords={records ?? []} />
    </div>
  );
}
