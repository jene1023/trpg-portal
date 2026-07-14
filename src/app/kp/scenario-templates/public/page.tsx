export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft, BookMarked, Globe } from "lucide-react";
import { supabase, isSupabaseConfigured, ScenarioTemplate, ScenarioTemplateData } from "@/lib/supabase";

export default async function PublicScenarioTemplatesPage() {
  let templates: ScenarioTemplate[] = [];

  if (isSupabaseConfigured) {
    const { data } = await supabase
      .from("scenario_templates")
      .select("*")
      .eq("is_public", true)
      .order("created_at", { ascending: false });
    templates = (data ?? []) as ScenarioTemplate[];
  }

  return (
    <div className="min-h-screen coc-bg px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <nav className="flex items-center gap-2 text-xs text-coc-muted">
          <Link href="/kp/scenario-templates" className="flex items-center gap-1 hover:text-coc-gold transition-colors">
            <ArrowLeft size={13} />
            マイテンプレート
          </Link>
          <span>·</span>
          <span className="text-coc-gold">公開テンプレート</span>
        </nav>

        <div>
          <h1 className="font-cinzel text-2xl font-bold text-coc-gold tracking-widest mb-1">
            コミュニティ公開テンプレート
          </h1>
          <p className="text-sm text-coc-muted">
            他のKPが公開したシナリオ構造テンプレート一覧です。気に入ったものを骨格として使い回せます。
          </p>
        </div>

        {templates.length === 0 ? (
          <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-10 text-center">
            <Globe size={32} className="mx-auto mb-3 text-coc-faint" />
            <p className="text-sm text-coc-muted">公開テンプレートはまだありません</p>
            <p className="text-xs text-coc-faint mt-1">
              シナリオをテンプレートとして保存する際に「コミュニティに公開」を選択するとここに表示されます
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-coc-muted">
              {templates.length}件のテンプレート
            </p>
            {templates.map((t) => {
              const td = t.template_data as ScenarioTemplateData;
              return (
                <div
                  key={t.id}
                  className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <BookMarked size={14} className="text-coc-gold flex-shrink-0" />
                        <p className="font-cinzel font-semibold text-coc-text text-sm">{t.title}</p>
                      </div>
                      {t.description && (
                        <p className="text-xs text-coc-muted mb-2">{t.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 text-xs text-coc-faint">
                        {td.scenes.length > 0 && (
                          <span className="rounded-full border border-coc-border px-2 py-0.5">
                            シーン {td.scenes.length}
                          </span>
                        )}
                        {td.npc_slots.length > 0 && (
                          <span className="rounded-full border border-coc-border px-2 py-0.5">
                            NPC枠 {td.npc_slots.length}
                          </span>
                        )}
                        {td.handout_count > 0 && (
                          <span className="rounded-full border border-coc-border px-2 py-0.5">
                            ハンドアウト {td.handout_count}枚
                          </span>
                        )}
                        {td.creature_slots.length > 0 && (
                          <span className="rounded-full border border-coc-border px-2 py-0.5">
                            クリーチャー枠 {td.creature_slots.length}
                          </span>
                        )}
                      </div>
                      {td.scenes.length > 0 && (
                        <div className="mt-2 space-y-0.5">
                          {td.scenes.map((s, i) => (
                            <p key={i} className="text-xs text-coc-faint">
                              <span className="text-coc-muted mr-1">{s.order}.</span>
                              {s.title}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="rounded-xl border border-coc-gold-dim bg-coc-raised px-5 py-4 text-sm text-coc-muted">
          テンプレートを使ってシナリオを作成するには、
          <Link href="/kp/scenario-templates" className="text-coc-gold hover:underline mx-1">
            マイテンプレート
          </Link>
          ページから「このテンプレートでシナリオ作成」ボタンを使用してください。
        </div>
      </div>
    </div>
  );
}
