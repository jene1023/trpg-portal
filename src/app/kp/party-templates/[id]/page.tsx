export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase, isSupabaseConfigured, PartyTemplate } from "@/lib/supabase";
import PartyTemplateEditor from "./PartyTemplateEditor";

type Props = { params: Promise<{ id: string }> };

export default async function PartyTemplateDetailPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data } = await supabase
    .from("party_templates")
    .select("*")
    .eq("id", id)
    .single();

  if (!data) notFound();

  const template = data as PartyTemplate;

  return (
    <div className="min-h-screen coc-bg px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/kp/party-templates"
            className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
          >
            <ArrowLeft size={16} />
            テンプレート一覧
          </Link>
        </div>

        <div>
          <h1 className="font-cinzel text-2xl font-bold text-coc-gold tracking-widest mb-1">
            {template.name}
          </h1>
          {template.description && (
            <p className="text-sm text-coc-muted">{template.description}</p>
          )}
          <p className="text-xs text-coc-faint mt-1">
            作成日: {new Date(template.created_at).toLocaleDateString("ja-JP")}
          </p>
        </div>

        <PartyTemplateEditor template={template} />
      </div>
    </div>
  );
}
