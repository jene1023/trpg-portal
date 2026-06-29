"use client";

import { useState } from "react";
import { supabase, isSupabaseConfigured, QuickNote } from "@/lib/supabase";

type Props = {
  characterId: string;
  initialNotes: QuickNote[];
};

function formatDatetime(iso: string): string {
  return new Date(iso).toLocaleString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function QuickNoteList({ characterId, initialNotes }: Props) {
  const [notes, setNotes] = useState<QuickNote[]>(initialNotes);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!content.trim()) return;
    if (!isSupabaseConfigured) return;

    setSaving(true);
    const { data, error } = await supabase
      .from("quick_notes")
      .insert({ character_id: characterId, content: content.trim() })
      .select()
      .single();
    setSaving(false);

    if (!error && data) {
      setNotes((prev) => [data as QuickNote, ...prev].slice(0, 10));
      setContent("");
    }
  }

  async function remove(id: string) {
    if (!isSupabaseConfigured) return;
    await supabase.from("quick_notes").delete().eq("id", id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }

  const inputClass =
    "w-full rounded-md border border-coc-border bg-coc-void px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:outline-none focus:border-coc-gold resize-none";

  return (
    <div className="space-y-4">
      {/* 入力エリア */}
      <div className="rounded-lg border border-coc-border bg-coc-surface p-4 space-y-3">
        <h3 className="font-cinzel text-sm font-semibold text-coc-gold tracking-widest">
          メモを追加
        </h3>
        <textarea
          rows={3}
          placeholder="走り書きメモ（重要情報、KPの発言、思いついたこと…）"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className={inputClass}
        />
        <button
          onClick={save}
          disabled={saving || !content.trim()}
          className="w-full rounded-lg bg-coc-gold text-black font-semibold text-sm py-2 disabled:opacity-40 hover:brightness-110 transition-all"
        >
          {saving ? "保存中…" : "保存"}
        </button>
      </div>

      {/* 一覧 */}
      {notes.length === 0 ? (
        <p className="text-sm text-coc-muted text-center py-4">メモはまだありません。</p>
      ) : (
        <div className="space-y-2">
          {notes.map((note) => (
            <div
              key={note.id}
              className="rounded-lg border border-coc-border bg-coc-surface p-3 flex gap-3 items-start"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-coc-text whitespace-pre-wrap leading-relaxed">
                  {note.content}
                </p>
                <time className="text-xs text-coc-muted mt-1 block">
                  {formatDatetime(note.created_at)}
                </time>
              </div>
              <button
                onClick={() => remove(note.id)}
                className="shrink-0 text-coc-muted hover:text-red-400 text-xs transition-colors pt-0.5"
              >
                削除
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
