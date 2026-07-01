export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import SkillGoalTracker from "@/app/_components/SkillGoalTracker";

type Props = { params: Promise<{ id: string }> };

export default async function SkillGoalsPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: char } = await supabase
    .from("characters")
    .select("id, name")
    .eq("id", id)
    .single();

  if (!char) notFound();

  const [{ data: skills }, { data: goals }] = await Promise.all([
    supabase.from("character_skills").select("*").eq("character_id", id),
    supabase
      .from("skill_goals")
      .select("*")
      .eq("character_id", id)
      .order("created_at", { ascending: true }),
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

      <h1 className="font-cinzel text-xl font-bold text-coc-text mb-2">技能目標トラッカー</h1>
      <p className="text-xs text-coc-muted mb-6">
        技能ごとに目標値を設定し、現在値からの達成率をプログレスバーで確認できます。
      </p>

      <SkillGoalTracker
        characterId={id}
        skills={skills ?? []}
        initialGoals={goals ?? []}
      />
    </div>
  );
}
