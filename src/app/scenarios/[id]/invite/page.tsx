export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import InviteTokenPanel from "@/app/_components/InviteTokenPanel";

type Props = { params: Promise<{ id: string }> };

export default async function ScenarioInvitePage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: scenario } = await supabase
    .from("scenarios")
    .select("id, title, recruit_token")
    .eq("id", id)
    .single();

  if (!scenario) notFound();

  return (
    <div className="coc-page-enter mx-auto max-w-xl px-4 py-8">
      <Link
        href={`/scenarios/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        シナリオ詳細へ戻る
      </Link>

      <h1 className="font-cinzel text-xl font-bold text-coc-text mb-1">
        参加招待コード
      </h1>
      <p className="text-xs text-coc-muted mb-6">
        招待URLまたはQRコードをPLに共有すると、PLが自分のキャラクターを選んで参加申請できます
      </p>

      <InviteTokenPanel
        scenarioId={scenario.id}
        scenarioTitle={scenario.title}
        initialToken={scenario.recruit_token ?? null}
      />
    </div>
  );
}
