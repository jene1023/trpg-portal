export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import FeedbackForm from "./FeedbackForm";

type Props = { params: Promise<{ slug: string }> };

export default async function PublicFeedbackPage({ params }: Props) {
  const { slug } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: scenario } = await supabase
    .from("scenarios")
    .select("id, title")
    .eq("id", slug)
    .single();

  if (!scenario) notFound();

  return (
    <div className="min-h-screen coc-bg flex items-start justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <p className="font-cinzel text-xs font-medium text-coc-muted uppercase tracking-widest mb-4 text-center">
          Call of Cthulhu
        </p>
        <FeedbackForm scenarioId={scenario.id} scenarioTitle={scenario.title} />
        <p className="text-center text-xs text-coc-muted mt-6">Powered by CoC Portal</p>
      </div>
    </div>
  );
}
