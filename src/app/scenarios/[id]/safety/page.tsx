export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { supabase, isSupabaseConfigured, ScenarioSafetySettings } from "@/lib/supabase";
import SafetySettingsForm from "@/app/_components/SafetySettingsForm";

type Props = { params: Promise<{ id: string }> };

export default async function ScenarioSafetyPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: scenario } = await supabase
    .from("scenarios")
    .select("id, title")
    .eq("id", id)
    .single();

  if (!scenario) notFound();

  const { data: settings } = await supabase
    .from("scenario_safety_settings")
    .select("*")
    .eq("scenario_id", id)
    .single();

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
        <div className="flex items-center gap-2">
          <ShieldAlert size={20} className="text-coc-gold" />
          <h1 className="font-cinzel text-xl font-bold text-coc-text">安全設定</h1>
        </div>
        <p className="text-xs text-coc-muted mt-1">
          X-Card・ライン＆ヴェールでセッションの安全な環境を整えます
        </p>
      </div>

      <div className="mb-4 rounded-xl border border-coc-border bg-coc-surface px-5 py-4">
        <p className="text-xs text-coc-muted leading-relaxed">
          <strong className="text-coc-text">安全ツールとは</strong>
          <br />
          TRPGセッションで参加者全員が安心して楽しめるよう、国際的に普及している仕組みです。
          <br /><br />
          <strong className="text-coc-text">X-Card</strong>: セッション中にいつでも使える「中断シグナル」。不快に感じた内容を止めるためのカードで、理由を説明する必要はありません。
          <br /><br />
          <strong className="text-coc-text">ライン</strong>: 絶対にシナリオに登場させないコンテンツ。
          <br />
          <strong className="text-coc-text">ヴェール</strong>: 描写できるが詳細は省略するコンテンツ（フェードアウト）。
        </p>
      </div>

      <SafetySettingsForm
        scenarioId={id}
        initial={settings as ScenarioSafetySettings | null}
      />
    </div>
  );
}
