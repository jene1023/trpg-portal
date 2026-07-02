export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase, isSupabaseConfigured, Character, ScenarioParticipant } from "@/lib/supabase";
import PartyMemberCard from "@/app/_components/PartyMemberCard";

type ParticipantWithCharacter = ScenarioParticipant & {
  characters: Character;
};

type Props = { params: Promise<{ id: string }> };

export default async function PartyViewPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: scenario } = await supabase
    .from("scenarios")
    .select("id, title")
    .eq("id", id)
    .single();

  if (!scenario) notFound();

  const { data: participants } = await supabase
    .from("scenario_participants")
    .select("*, characters(*)")
    .eq("scenario_id", id)
    .order("created_at", { ascending: true });

  const list = (participants ?? []) as ParticipantWithCharacter[];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/scenarios/${id}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          シナリオ詳細
        </Link>
      </div>

      <div className="mb-6">
        <p className="text-xs text-coc-muted mb-1">{scenario.title}</p>
        <h1 className="font-cinzel text-xl font-bold text-coc-text">パーティービュー</h1>
        <p className="text-xs text-coc-muted mt-1">参加者全員のHP / MP / SANを一覧確認</p>
      </div>

      {list.length === 0 ? (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-8 text-center">
          <p className="text-coc-muted text-sm">参加キャラクターが登録されていません。</p>
          <Link
            href={`/scenarios/${id}/participants`}
            className="mt-3 inline-block text-xs text-coc-gold hover:underline"
          >
            参加キャラクターを追加 →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {list.map(({ characters: char }) => (
            <PartyMemberCard key={char.id} char={char} />
          ))}
        </div>
      )}

      <div className="mt-6 text-xs text-coc-muted text-center">
        <span className="inline-flex items-center gap-3">
          <span className="text-green-400">■</span> 50%超
          <span className="text-yellow-400">■</span> 25〜50%
          <span className="text-red-400">■</span> 25%以下
        </span>
      </div>
    </div>
  );
}
