export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ScenarioForm from "@/app/_components/ScenarioForm";
import { supabase, isSupabaseConfigured, ScenarioTemplate } from "@/lib/supabase";

type Props = { searchParams: Promise<{ templateId?: string }> };

export default async function NewScenarioPage({ searchParams }: Props) {
  const { templateId } = await searchParams;

  let template: ScenarioTemplate | null = null;
  if (templateId && isSupabaseConfigured) {
    const { data } = await supabase
      .from("scenario_templates")
      .select("*")
      .eq("id", templateId)
      .single();
    template = data ?? null;
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/scenarios"
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          シナリオ一覧
        </Link>
        {template && (
          <span className="text-xs text-coc-muted">
            テンプレート「{template.title}」から作成
          </span>
        )}
      </div>
      <h1 className="font-cinzel text-xl font-bold text-coc-text mb-6">
        シナリオを登録
      </h1>
      <ScenarioForm
        initialTitle={template ? template.title : undefined}
        templateData={template ? template.template_data : undefined}
      />
    </div>
  );
}
