export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Library } from "lucide-react";
import { supabase, isSupabaseConfigured, Material } from "@/lib/supabase";
import ScenarioMaterialList from "@/app/_components/ScenarioMaterialList";

type Props = { params: Promise<{ id: string }> };

export default async function ScenarioMaterialsPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: scenario } = await supabase
    .from("scenarios")
    .select("id, title")
    .eq("id", id)
    .single();

  if (!scenario) notFound();

  const { data: materials } = await supabase
    .from("materials")
    .select("*")
    .contains("tags", [id])
    .order("created_at", { ascending: true });

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

      <div className="flex items-center gap-2 mb-1">
        <Library size={20} className="text-coc-gold" />
        <h1 className="font-cinzel text-xl font-bold text-coc-text">素材ライブラリ</h1>
      </div>
      <p className="text-xs text-coc-muted mb-1">{scenario.title}</p>
      <p className="text-xs text-coc-muted mb-6">
        BGM・マップ・参考画像などのリンクをタグと種別付きで管理します
      </p>

      <ScenarioMaterialList
        scenarioId={id}
        initialMaterials={(materials ?? []) as Material[]}
      />
    </div>
  );
}
