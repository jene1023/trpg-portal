"use client";

import { useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type Mood = "hopeful" | "fearful" | "determined" | "despairing" | "curious" | "numb";

type JournalEntry = {
  id: string;
  character_id: string;
  session_label: string | null;
  entry_date: string | null;
  title: string;
  content: string;
  mood: Mood | null;
  is_private: boolean;
  created_at: string;
};

const MOOD_OPTIONS: { value: Mood; label: string; emoji: string }[] = [
  { value: "hopeful", label: "希望", emoji: "🌟" },
  { value: "fearful", label: "恐怖", emoji: "😨" },
  { value: "determined", label: "決意", emoji: "💪" },
  { value: "despairing", label: "絶望", emoji: "😔" },
  { value: "curious", label: "好奇", emoji: "🔍" },
  { value: "numb", label: "麻痺", emoji: "😶" },
];

function moodBadge(mood: Mood | null) {
  if (!mood) return null;
  const found = MOOD_OPTIONS.find((m) => m.value === mood);
  if (!found) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded border border-coc-border bg-coc-raised px-1.5 py-0.5 text-xs text-coc-muted">
      {found.emoji} {found.label}
    </span>
  );
}

type Props = {
  characterId: string;
  initialEntries: JournalEntry[];
};

export default function JournalClient({ characterId, initialEntries }: Props) {
  const [entries, setEntries] = useState<JournalEntry[]>(initialEntries);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<Mood | "">("");
  const [sessionLabel, setSessionLabel] = useState("");
  const [entryDate, setEntryDate] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function addEntry() {
    if (!title.trim() || !content.trim()) return;
    if (!isSupabaseConfigured) return;
    setSaving(true);
    setError("");
    const { data, error: err } = await supabase
      .from("character_journal_entries")
      .insert({
        character_id: characterId,
        title: title.trim(),
        content: content.trim(),
        mood: mood || null,
        session_label: sessionLabel.trim() || null,
        entry_date: entryDate || null,
        is_private: isPrivate,
      })
      .select()
      .single();
    setSaving(false);
    if (err || !data) {
      setError("追加に失敗しました");
      return;
    }
    setEntries((prev) => [data as JournalEntry, ...prev]);
    setTitle("");
    setContent("");
    setMood("");
    setSessionLabel("");
    setEntryDate("");
    setIsPrivate(true);
    setShowForm(false);
  }

  async function deleteEntry(entryId: string) {
    if (!isSupabaseConfigured) return;
    await supabase.from("character_journal_entries").delete().eq("id", entryId);
    setEntries((prev) => prev.filter((e) => e.id !== entryId));
  }

  return (
    <div className="space-y-6">
      {/* 追加ボタン / フォーム */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full rounded-lg border border-dashed border-coc-border bg-coc-surface px-4 py-3 text-sm text-coc-muted hover:text-coc-text hover:border-coc-border-glow transition-colors"
        >
          ＋ 新しい日誌を書く
        </button>
      ) : (
        <div className="rounded-lg border border-coc-border coc-card-bg p-4 space-y-3">
          <h2 className="text-sm font-semibold text-coc-muted uppercase tracking-widest">
            日誌を追加
          </h2>
          <input
            type="text"
            placeholder="タイトル（例: あの夜のこと）"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded border border-coc-border bg-coc-void px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted/50 focus:outline-none focus:border-coc-gold/60"
          />
          <textarea
            placeholder="本文（1人称で自由に記述してください）"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            className="w-full rounded border border-coc-border bg-coc-void px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted/50 focus:outline-none focus:border-coc-gold/60 resize-y"
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-coc-muted block mb-1">心境</label>
              <select
                value={mood}
                onChange={(e) => setMood(e.target.value as Mood | "")}
                className="w-full rounded border border-coc-border bg-coc-void px-2 py-1.5 text-sm text-coc-text focus:outline-none focus:border-coc-gold/60"
              >
                <option value="">— 選択 —</option>
                {MOOD_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.emoji} {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-coc-muted block mb-1">日付</label>
              <input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="w-full rounded border border-coc-border bg-coc-void px-2 py-1.5 text-sm text-coc-text focus:outline-none focus:border-coc-gold/60"
              />
            </div>
          </div>
          <input
            type="text"
            placeholder="セッション名（例: 深淵の呼び声 第3話）"
            value={sessionLabel}
            onChange={(e) => setSessionLabel(e.target.value)}
            className="w-full rounded border border-coc-border bg-coc-void px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted/50 focus:outline-none focus:border-coc-gold/60"
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="rounded border-coc-border"
            />
            <span className="text-xs text-coc-muted">非公開（公開キャラページに表示しない）</span>
          </label>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex items-center gap-2">
            <button
              onClick={addEntry}
              disabled={saving || !title.trim() || !content.trim()}
              className="rounded bg-coc-gold/20 border border-coc-gold/50 px-4 py-1.5 text-sm text-coc-gold hover:bg-coc-gold/30 transition-colors disabled:opacity-50"
            >
              {saving ? "保存中..." : "保存"}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setError("");
              }}
              className="rounded border border-coc-border px-3 py-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* エントリ一覧 */}
      {entries.length === 0 ? (
        <p className="text-center text-sm text-coc-muted py-8">
          日誌がまだありません
        </p>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-coc-muted uppercase tracking-widest font-semibold">
            記録 {entries.length}件
          </p>
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="rounded-lg border border-coc-border bg-coc-surface"
            >
              <button
                className="w-full text-left px-4 py-3 flex items-start justify-between gap-3"
                onClick={() =>
                  setExpandedId((prev) => (prev === entry.id ? null : entry.id))
                }
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-coc-text leading-snug">
                      {entry.title}
                    </p>
                    {moodBadge(entry.mood)}
                    {!entry.is_private && (
                      <span className="rounded border border-blue-700/60 bg-blue-950/20 px-1.5 py-0.5 text-xs text-blue-400">
                        公開
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-coc-muted">
                    {entry.entry_date && <span>{entry.entry_date}</span>}
                    {entry.session_label && (
                      <>
                        {entry.entry_date && <span>·</span>}
                        <span>{entry.session_label}</span>
                      </>
                    )}
                  </div>
                </div>
                <span className="text-coc-gold shrink-0 mt-0.5">
                  {expandedId === entry.id ? "▲" : "▼"}
                </span>
              </button>

              {expandedId === entry.id && (
                <div className="px-4 pb-4 space-y-3 border-t border-coc-border/50">
                  <p className="font-crimson text-coc-text leading-relaxed whitespace-pre-wrap text-[15px] pt-3">
                    {entry.content}
                  </p>
                  <div className="flex justify-end">
                    <button
                      onClick={() => deleteEntry(entry.id)}
                      className="text-xs text-red-500/50 hover:text-red-400 transition-colors"
                    >
                      削除
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
