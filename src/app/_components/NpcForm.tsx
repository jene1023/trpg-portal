"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export default function NpcForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    scenario_name: "",
    name: "",
    appearance: "",
    purpose: "",
    notes: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("NPC名は必須です。");
      return;
    }
    if (!isSupabaseConfigured) {
      setError("Supabase が設定されていません。");
      return;
    }
    setSaving(true);
    setError(null);
    const { error: err } = await supabase.from("npcs").insert({
      scenario_name: form.scenario_name.trim() || null,
      name: form.name.trim(),
      appearance: form.appearance.trim() || null,
      purpose: form.purpose.trim() || null,
      notes: form.notes.trim() || null,
    });
    if (err) {
      setError(err.message);
      setSaving(false);
      return;
    }
    router.push("/npcs");
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
        <label htmlFor="scenario_name" className={labelClass}>
          シナリオ名
        </label>
        <input
          id="scenario_name"
          name="scenario_name"
          value={form.scenario_name}
          onChange={handleChange}
          placeholder="例: インスマスを覆う影"
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="name" className={labelClass}>
          NPC名 <span className="text-coc-gold">*</span>
        </label>
        <input
          id="name"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="例: ザドック・アレン"
          required
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="appearance" className={labelClass}>
          外見
        </label>
        <textarea
          id="appearance"
          name="appearance"
          value={form.appearance}
          onChange={handleChange}
          placeholder="容姿・服装・特徴など"
          rows={3}
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="purpose" className={labelClass}>
          目的・役割
        </label>
        <textarea
          id="purpose"
          name="purpose"
          value={form.purpose}
          onChange={handleChange}
          placeholder="シナリオ内での目的や役割"
          rows={3}
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="notes" className={labelClass}>
          メモ
        </label>
        <textarea
          id="notes"
          name="notes"
          value={form.notes}
          onChange={handleChange}
          placeholder="KP用の秘密メモ・能力値など"
          rows={4}
          className={fieldClass}
        />
      </div>

      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={() => router.push("/npcs")}
          className="rounded-lg border border-coc-border px-4 py-2 text-sm text-coc-muted hover:text-coc-text hover:border-coc-muted transition-colors"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg border border-coc-gold-dim bg-coc-raised px-4 py-2 text-sm text-coc-gold hover:bg-coc-surface hover:border-coc-gold transition-colors disabled:opacity-50"
        >
          {saving ? "登録中..." : "NPC を登録"}
        </button>
      </div>
    </form>
  );
}
