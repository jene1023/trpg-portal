export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { computeDamageBonus } from "@/lib/diceExpression";
import InventoryForm from "@/app/_components/InventoryForm";

type Props = { params: Promise<{ id: string }> };

export default async function InventoryPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: char } = await supabase
    .from("characters")
    .select("id, name, str, siz")
    .eq("id", id)
    .single();

  if (!char) notFound();

  const damageBonus = computeDamageBonus(char.str, char.siz);

  const [{ data: items }, { data: skills }] = await Promise.all([
    supabase
      .from("inventory_items")
      .select("*")
      .eq("character_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("character_skills")
      .select("*")
      .eq("character_id", id)
      .order("skill_name", { ascending: true }),
  ]);

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

      <h1 className="font-cinzel text-xl font-bold text-coc-text mb-6">
        武器・所持品
      </h1>

      <InventoryForm
        characterId={id}
        initialItems={items ?? []}
        skills={skills ?? []}
        damageBonus={damageBonus}
      />
    </div>
  );
}
