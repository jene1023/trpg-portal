export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Megaphone } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import RecruitBoardList from "@/app/_components/RecruitBoardList";

export default async function RecruitBoardPage() {
  if (!isSupabaseConfigured) notFound();

  const { data: scenarios } = await supabase
    .from("scenarios")
    .select(
      "id, title, synopsis, difficulty, playtime_type, min_players, max_players, estimated_hours, recruit_token, teaser_text"
    )
    .not("recruit_token", "is", null)
    .eq("teaser_is_public", true)
    .order("created_at", { ascending: false });

  return (
    <div className="coc-page-enter mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <Link
          href="/scenarios"
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          シナリオ一覧
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-2">
        <Megaphone size={22} className="text-coc-gold" />
        <h1 className="font-cinzel text-2xl font-bold text-coc-text">シナリオ公募掲示板</h1>
      </div>
      <p className="text-sm text-coc-muted mb-6">
        参加者を募集中のシナリオ一覧です。難易度やプレイ時間でフィルタして参加申請できます。
      </p>

      <RecruitBoardList scenarios={scenarios ?? []} />
    </div>
  );
}
