"use client";

import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured, KpMemoEntityType } from "@/lib/supabase";

type Props = {
  entityType: KpMemoEntityType;
  entityId: string;
};

export default function KpMemoSection({ entityType, entityId }: Props) {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    supabase
      .from("kp_memos")
      .select("content")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setContent(data.content);
        setLoading(false);
      });
  }, [entityType, entityId]);

  async function handleSave() {
    if (!isSupabaseConfigured) return;
    setSaving(true);
    await supabase.from("kp_memos").upsert(
      { entity_type: entityType, entity_id: entityId, content },
      { onConflict: "entity_type,entity_id" }
    );
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <details className="rounded-lg border border-coc-border bg-coc-surface overflow-hidden group">
      <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-semibold text-coc-muted uppercase tracking-widest font-cinzel hover:bg-coc-raised transition-colors select-none">
        <span>KP 秘匿メモ</span>
        <span className="text-xs normal-case font-normal text-coc-faint group-open:hidden">▶ 展開</span>
        <span className="text-xs normal-case font-normal text-coc-faint hidden group-open:inline">▼ 閉じる</span>
      </summary>
      <div className="px-4 py-3 space-y-3 border-t border-coc-border">
        {loading ? (
          <p className="text-xs text-coc-muted">読み込み中…</p>
        ) : (
          <>
            <p className="text-xs text-coc-faint">PLに見せない秘匿情報（真の正体・隠し設定・KP向け注記）</p>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              placeholder="ここに入力した内容はKP専用です…"
              className="w-full rounded-md border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-faint focus:outline-none focus:border-coc-gold resize-none"
            />
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-md border border-coc-border bg-coc-raised px-4 py-1.5 text-xs font-semibold text-coc-muted hover:text-coc-text hover:border-coc-gold transition-colors disabled:opacity-50"
            >
              {saving ? "保存中…" : saved ? "保存済み ✓" : "保存"}
            </button>
          </>
        )}
      </div>
    </details>
  );
}
