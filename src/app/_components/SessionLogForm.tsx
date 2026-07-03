"use client";

import { useState } from "react";
import { supabase, isSupabaseConfigured, SessionLog } from "@/lib/supabase";

type Props = {
  characterId: string;
  nextSessionNumber: number;
  onAdded: (log: SessionLog) => void;
};

export default function SessionLogForm({ characterId, nextSessionNumber, onAdded }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    session_number: nextSessionNumber,
    title: "",
    summary: "",
    san_loss: 0,
    hp_loss: 0,
    played_at: "",
    recording_url: "",
  });

  function change(field: string, value: string | number) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (!isSupabaseConfigured) return;

    setSaving(true);
    const { data, error } = await supabase
      .from("sessions")
      .insert({
        character_id: characterId,
        session_number: form.session_number,
        title: form.title.trim(),
        summary: form.summary.trim() || null,
        san_loss: form.san_loss,
        hp_loss: form.hp_loss,
        played_at: form.played_at || null,
        recording_url: form.recording_url.trim() || null,
      })
      .select()
      .single();

    setSaving(false);

    if (!error && data) {
      onAdded(data as SessionLog);
      setForm({
        session_number: form.session_number + 1,
        title: "",
        summary: "",
        san_loss: 0,
        hp_loss: 0,
        played_at: "",
        recording_url: "",
      });
      setOpen(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-lg border border-dashed border-coc-border text-coc-muted hover:text-coc-text hover:border-coc-border-glow py-3 text-sm transition-colors"
      >
        ＋ セッションを記録
      </button>
    );
  }

  const inputClass =
    "w-full rounded-md border border-coc-border bg-coc-void px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:outline-none focus:border-coc-gold";
  const labelClass = "block text-xs text-coc-muted mb-1";

  return (
    <form onSubmit={submit} className="rounded-lg border border-coc-border bg-coc-surface p-4 space-y-3">
      <h3 className="font-cinzel text-sm font-semibold text-coc-gold tracking-widest">新規セッション記録</h3>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>セッション番号</label>
          <input
            type="number"
            min={1}
            value={form.session_number}
            onChange={(e) => change("session_number", parseInt(e.target.value) || 1)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>プレイ日</label>
          <input
            type="date"
            value={form.played_at}
            onChange={(e) => change("played_at", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>タイトル *</label>
        <input
          type="text"
          required
          placeholder="例: 呪われた屋敷の夜"
          value={form.title}
          onChange={(e) => change("title", e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>出来事・サマリー</label>
        <textarea
          rows={3}
          placeholder="セッションの概要・重要な出来事・決定事項など"
          value={form.summary}
          onChange={(e) => change("summary", e.target.value)}
          className={inputClass + " resize-none"}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>SAN喪失量</label>
          <input
            type="number"
            min={0}
            value={form.san_loss}
            onChange={(e) => change("san_loss", parseInt(e.target.value) || 0)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>HP喪失量</label>
          <input
            type="number"
            min={0}
            value={form.hp_loss}
            onChange={(e) => change("hp_loss", parseInt(e.target.value) || 0)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>録音・録画アーカイブURL（任意）</label>
        <input
          type="url"
          placeholder="https://..."
          value={form.recording_url}
          onChange={(e) => change("recording_url", e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={saving || !form.title.trim()}
          className="flex-1 rounded-lg bg-coc-gold text-black font-semibold text-sm py-2 disabled:opacity-40 hover:brightness-110 transition-all"
        >
          {saving ? "保存中…" : "記録する"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 rounded-lg border border-coc-border text-coc-muted hover:text-coc-text text-sm transition-colors"
        >
          キャンセル
        </button>
      </div>
    </form>
  );
}
