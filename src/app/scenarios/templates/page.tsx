"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookMarked, BookOpen, Users, FileText, Swords } from "lucide-react";
import { supabase, isSupabaseConfigured, ScenarioTemplate } from "@/lib/supabase";

export default function ScenarioTemplatesPage() {
  const [templates, setTemplates] = useState<ScenarioTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    supabase
      .from("scenario_templates")
      .select("*")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setTemplates(data ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/scenarios"
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          シナリオ一覧
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <BookMarked size={22} className="text-coc-gold" />
        <h1 className="font-cinzel text-2xl font-bold text-coc-text">テンプレートギャラリー</h1>
      </div>
      <p className="text-sm text-coc-muted mb-8">
        KPが公開したシナリオテンプレートから1クリックで新規シナリオを準備できます。シーン・NPC枠・ハンドアウト枠が自動セットアップされます。
      </p>

      {loading && <p className="text-sm text-coc-muted">読み込み中…</p>}

      {!loading && templates.length === 0 && (
        <div className="rounded-xl border border-coc-border bg-coc-surface p-10 text-center">
          <BookMarked size={36} className="text-coc-faint mx-auto mb-3" />
          <p className="text-sm text-coc-muted">公開テンプレートはまだありません。</p>
          <p className="text-xs text-coc-faint mt-1">
            シナリオ詳細ページから「テンプレートとして保存」で公開できます。
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {templates.map((t) => {
          const sceneCount = t.template_data.scenes.length;
          const npcCount = t.template_data.npc_slots.length;
          const handoutCount = t.template_data.handout_count;
          const creatureCount = t.template_data.creature_slots.length;

          return (
            <div
              key={t.id}
              className="rounded-xl border border-coc-border bg-coc-surface p-5 flex flex-col gap-4 hover:border-coc-gold-dim transition-colors"
            >
              <div>
                <h2 className="font-cinzel font-bold text-coc-text text-base mb-1">{t.title}</h2>
                {t.description && (
                  <p className="text-xs text-coc-muted line-clamp-2">{t.description}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1.5 rounded-lg bg-coc-raised px-2.5 py-1.5">
                  <BookOpen size={13} className="text-coc-gold flex-shrink-0" />
                  <span className="text-xs text-coc-muted">シーン</span>
                  <span className="text-xs font-bold text-coc-text ml-auto">{sceneCount}</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-coc-raised px-2.5 py-1.5">
                  <Users size={13} className="text-coc-gold flex-shrink-0" />
                  <span className="text-xs text-coc-muted">NPC枠</span>
                  <span className="text-xs font-bold text-coc-text ml-auto">{npcCount}</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-coc-raised px-2.5 py-1.5">
                  <FileText size={13} className="text-coc-gold flex-shrink-0" />
                  <span className="text-xs text-coc-muted">HO枠</span>
                  <span className="text-xs font-bold text-coc-text ml-auto">{handoutCount}</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-coc-raised px-2.5 py-1.5">
                  <Swords size={13} className="text-coc-gold flex-shrink-0" />
                  <span className="text-xs text-coc-muted">CRE枠</span>
                  <span className="text-xs font-bold text-coc-text ml-auto">{creatureCount}</span>
                </div>
              </div>

              <p className="text-xs text-coc-faint">
                {new Date(t.created_at).toLocaleDateString("ja-JP")}
              </p>

              <Link
                href={`/scenarios/new?templateId=${t.id}`}
                className="w-full text-center rounded-lg bg-coc-gold text-black font-semibold text-sm px-4 py-2.5 hover:brightness-110 transition-all"
              >
                このテンプレートで新規シナリオ
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
