"use client";

import { useState } from "react";
import { Globe, GlobeLock } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type Props = {
  scenarioId: string;
  initialIsPublic: boolean;
};

export default function RecruitBoardPublishToggle({ scenarioId, initialIsPublic }: Props) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [saving, setSaving] = useState(false);

  async function handleToggle() {
    if (!isSupabaseConfigured) return;
    const next = !isPublic;
    setSaving(true);
    await supabase.from("scenarios").update({ teaser_is_public: next }).eq("id", scenarioId);
    setIsPublic(next);
    setSaving(false);
  }

  return (
    <button
      onClick={handleToggle}
      disabled={saving}
      className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors disabled:opacity-50 ${
        isPublic
          ? "border-coc-gold bg-coc-gold/10 text-coc-gold"
          : "border-coc-border text-coc-muted hover:border-coc-gold hover:text-coc-text"
      }`}
    >
      {isPublic ? <Globe size={14} /> : <GlobeLock size={14} />}
      {saving ? "..." : isPublic ? "掲示板公開中" : "掲示板に公開する"}
    </button>
  );
}
