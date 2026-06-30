"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { supabase, isSupabaseConfigured, ScenarioNote } from "@/lib/supabase";

type Props = {
  scenarioId: string;
  initialNotes: ScenarioNote[];
};

export default function ScenarioNoteList({ scenarioId, initialNotes }: Props) {
  const [notes, setNotes] = useState<ScenarioNote[]>(initialNotes);
  const [content, setContent] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured) return;
    if (!content.trim()) return;
    setSaving(true);

    const { data, error } = await supabase
      .from("scenario_notes")
      .insert({
        scenario_id: scenarioId,
        content: content.trim(),
        author_name: authorName.trim() || null,
      })
      .select()
      .single();

    if (!error && data) {
      setNotes((prev) => [data as ScenarioNote, ...prev]);
      setContent("");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!isSupabaseConfigured) return;
    await supabase.from("scenario_notes").delete().eq("id", id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-coc-border bg-coc-surface p-4 space-y-3"
      >
        <div>
          <label className="block text-xs text-coc-muted mb-1">記入者名</label>
          <input
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-faint focus:outline-none focus:border-coc-gold transition-colors"
            placeholder="例: KP田中（省略可）"
          />
        </div>

        <div>
          <label className="block text-xs text-coc-muted mb-1">メモ *</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            required
            className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-faint focus:outline-none focus:border-coc-gold transition-colors resize-none"
            placeholder="判明した手がかり・決定事項・次のアクションなど"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-1.5 rounded-lg bg-coc-gold px-4 py-2 text-sm font-semibold text-coc-bg hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          <Plus size={16} />
          {saving ? "保存中..." : "メモを追加"}
        </button>
      </form>

      {notes.length === 0 ? (
        <p className="text-center text-coc-muted text-sm py-8">
          共有メモはまだありません
        </p>
      ) : (
        <div className="space-y-3">
          {notes.map((n) => (
            <div
              key={n.id}
              className="rounded-xl border border-coc-border bg-coc-surface p-4 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap text-xs text-coc-muted">
                  {n.author_name && (
                    <span className="text-coc-gold">{n.author_name}</span>
                  )}
                  <span>{new Date(n.created_at).toLocaleString("ja-JP")}</span>
                </div>
                <button
                  onClick={() => handleDelete(n.id)}
                  className="text-coc-faint hover:text-red-400 transition-colors shrink-0"
                  title="削除"
                >
                  <X size={15} />
                </button>
              </div>
              <p className="font-crimson text-coc-text text-[15px] leading-relaxed whitespace-pre-wrap border-l-2 border-coc-border pl-3">
                {n.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
