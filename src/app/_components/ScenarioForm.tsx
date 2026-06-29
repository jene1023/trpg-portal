"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, isSupabaseConfigured, ScenarioStatus } from "@/lib/supabase";

export default function ScenarioForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    synopsis: "",
    gm_notes: "",
    status: "planning" as ScenarioStatus,
    played_at: "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("タイトルは必須です。");
      return;
    }
    if (!isSupabaseConfigured) {
      setError("Supabase が設定されていません。");
      return;
    }
    setSaving(true);
    setError(null);
    const { error: err } = await supabase.from("scenarios").insert({
      title: form.title.trim(),
      synopsis: form.synopsis.trim() || null,
      gm_notes: form.gm_notes.trim() || null,
      status: form.status,
      played_at: form.played_at || null,
    });
    if (err) {
      setError(err.message);
      setSaving(false);
      return;
    }
    router.push("/scenarios");
    router.refresh();
  }

  const fieldClass =
    "w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder-coc-faint focus:outline-none focus:border-coc-gold transition-colors";
  const labelClass = "block text-xs font-medium text-coc-muted mb-1";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error && (
        <p className="rounded-lg border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}

      <div>
        <label htmlFor="title" className={labelClass}>
          タイトル <span className="text-coc-gold">*</span>
        </label>
        <input
          id="title"
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="例: インスマスを覆う影"
          required
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="status" className={labelClass}>
          進行状態
        </label>
        <select
          id="status"
          name="status"
          value={form.status}
          onChange={handleChange}
          className={fieldClass}
        >
          <option value="planning">準備中</option>
          <option value="ongoing">進行中</option>
          <option value="completed">完了</option>
        </select>
      </div>

      <div>
        <label htmlFor="played_at" className={labelClass}>
          プレイ日
        </label>
        <input
          id="played_at"
          name="played_at"
          type="date"
          value={form.played_at}
          onChange={handleChange}
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="synopsis" className={labelClass}>
          概要
        </label>
        <textarea
          id="synopsis"
          name="synopsis"
          value={form.synopsis}
          onChange={handleChange}
          placeholder="シナリオの概要・あらすじ"
          rows={4}
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="gm_notes" className={labelClass}>
          GMメモ
        </label>
        <textarea
          id="gm_notes"
          name="gm_notes"
          value={form.gm_notes}
          onChange={handleChange}
          placeholder="KP用の秘密メモ・攻略ヒント・注意事項など"
          rows={5}
          className={fieldClass}
        />
      </div>

      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={() => router.push("/scenarios")}
          className="rounded-lg border border-coc-border px-4 py-2 text-sm text-coc-muted hover:text-coc-text hover:border-coc-muted transition-colors"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg border border-coc-gold-dim bg-coc-raised px-4 py-2 text-sm text-coc-gold hover:bg-coc-surface hover:border-coc-gold transition-colors disabled:opacity-50"
        >
          {saving ? "登録中..." : "シナリオを登録"}
        </button>
      </div>
    </form>
  );
}
