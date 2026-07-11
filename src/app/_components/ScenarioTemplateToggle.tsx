"use client";

import { useState } from "react";
import { BookMarked } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type Props = {
  scenarioId: string;
  initialIsTemplate: boolean;
  initialPublishedAt: string | null;
};

export default function ScenarioTemplateToggle({ scenarioId, initialIsTemplate, initialPublishedAt }: Props) {
  const [isTemplate, setIsTemplate] = useState(initialIsTemplate);
  const [publishedAt, setPublishedAt] = useState<string | null>(initialPublishedAt);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    if (!isSupabaseConfigured) return;
    setLoading(true);
    const newValue = !isTemplate;
    const newPublishedAt = newValue ? new Date().toISOString() : null;
    const { error } = await supabase
      .from("scenarios")
      .update({ is_template: newValue, template_published_at: newPublishedAt })
      .eq("id", scenarioId);
    if (!error) {
      setIsTemplate(newValue);
      setPublishedAt(newPublishedAt);
    }
    setLoading(false);
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <BookMarked size={16} className={isTemplate ? "text-coc-gold" : "text-coc-muted"} />
        <div>
          <p className="text-sm font-medium text-coc-text">テンプレートとして公開</p>
          {isTemplate && publishedAt && (
            <p className="text-xs text-coc-muted">
              公開日: {new Date(publishedAt).toLocaleDateString("ja-JP")}
            </p>
          )}
          {!isTemplate && (
            <p className="text-xs text-coc-muted">公開するとテンプレートライブラリに表示されます</p>
          )}
        </div>
      </div>
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
          isTemplate ? "bg-coc-gold" : "bg-coc-border"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            isTemplate ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
