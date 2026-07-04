export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import PhobiaList from "@/app/_components/PhobiaList";

type Props = { params: Promise<{ id: string }> };

export default async function PhobiasPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: char } = await supabase
    .from("characters")
    .select("id, name")
    .eq("id", id)
    .single();

  if (!char) notFound();

  const { data: phobias } = await supabase
    .from("character_phobias")
    .select("*")
    .eq("character_id", id)
    .order("created_at", { ascending: false });

  const activeCount = (phobias ?? []).filter((p) => p.is_active).length;

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

      <div className="flex items-center gap-3 mb-2">
        <h1 className="font-cinzel text-xl font-bold text-coc-text">
          恐怖症・マニア
        </h1>
        {activeCount > 0 && (
          <span className="rounded bg-red-900/60 border border-red-700 px-2 py-0.5 text-xs text-red-300 font-semibold">
            発症中 {activeCount}件
          </span>
        )}
      </div>
      <p className="text-sm text-coc-muted mb-6">
        CoC7版の恐怖症（フォビア）とマニア（躁病）を記録・追跡します。
      </p>

      <PhobiaList characterId={id} initialPhobias={phobias ?? []} />
    </div>
  );
}
