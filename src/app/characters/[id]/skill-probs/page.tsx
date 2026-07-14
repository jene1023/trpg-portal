export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import SkillProbChart from "./SkillProbChart";

type Props = { params: Promise<{ id: string }> };

export default async function SkillProbsPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: char } = await supabase
    .from("characters")
    .select("id, name")
    .eq("id", id)
    .single();

  if (!char) notFound();

  const { data: skills } = await supabase
    .from("character_skills")
    .select("*")
    .eq("character_id", id)
    .order("skill_name", { ascending: true });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/characters/${id}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          {char.name}
        </Link>
      </div>

      <h1 className="font-cinzel text-xl font-bold text-coc-text mb-1">技能成功確率チャート</h1>
      <p className="text-xs text-coc-muted mb-2">
        CoC 7版ルールに基づく各技能の成功確率を可視化しています。
      </p>
      <p className="text-xs text-coc-muted mb-8">
        決定的成功 = 技能値 ÷ 5（切捨て）／ 致命的失敗 = 96〜100（常に5%）
      </p>

      <SkillProbChart skills={skills ?? []} />
    </div>
  );
}
