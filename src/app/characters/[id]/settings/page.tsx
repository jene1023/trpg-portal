export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import PublicFieldsEditor from "@/app/_components/PublicFieldsEditor";

type Props = { params: Promise<{ id: string }> };

export default async function CharacterSettingsPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: char } = await supabase
    .from("characters")
    .select("id, name, public_fields")
    .eq("id", id)
    .single();

  if (!char) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/characters/${id}`}
          className="text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-cinzel text-xl font-bold text-coc-text">
          {char.name} — 公開設定
        </h1>
      </div>

      <div className="rounded-lg border border-coc-border coc-card-bg p-4 space-y-4">
        <h2 className="coc-section-title font-cinzel text-sm font-semibold text-coc-muted uppercase tracking-widest">
          公開プロフィール表示項目
        </h2>
        <PublicFieldsEditor
          characterId={id}
          initialFields={(char.public_fields as string[] | null) ?? null}
        />
      </div>
    </div>
  );
}
