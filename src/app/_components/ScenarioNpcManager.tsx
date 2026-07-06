"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Trash2, X, ChevronRight } from "lucide-react";
import { supabase, isSupabaseConfigured, Npc } from "@/lib/supabase";

type Props = {
  scenarioId: string;
  scenarioName: string;
  initialNpcs: Npc[];
};

export default function ScenarioNpcManager({ scenarioId, scenarioName, initialNpcs }: Props) {
  const [npcs, setNpcs] = useState<Npc[]>(initialNpcs);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    faction: "",
    appearance: "",
    purpose: "",
    notes: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function resetForm() {
    setForm({ name: "", faction: "", appearance: "", purpose: "", notes: "" });
    setError(null);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (!isSupabaseConfigured) return;
    setSaving(true);
    setError(null);

    const { data, error: err } = await supabase
      .from("npcs")
      .insert({
        scenario_name: scenarioName,
        name: form.name.trim(),
        faction: form.faction.trim() || null,
        appearance: form.appearance.trim() || null,
        purpose: form.purpose.trim() || null,
        notes: form.notes.trim() || null,
      })
      .select()
      .single();

    if (err) {
      setError(err.message);
      setSaving(false);
      return;
    }

    setNpcs((prev) => [...prev, data as Npc]);
    resetForm();
    setShowForm(false);
    setSaving(false);
  }

  async function handleDelete(npcId: string) {
    if (!isSupabaseConfigured) return;
    if (!confirm("このNPCを削除しますか？")) return;
    setDeleting(npcId);
    await supabase.from("npcs").delete().eq("id", npcId);
    setNpcs((prev) => prev.filter((n) => n.id !== npcId));
    setDeleting(null);
  }

  const fieldClass =
    "w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder-coc-faint focus:outline-none focus:border-coc-gold transition-colors";
  const labelClass = "block text-xs font-medium text-coc-muted mb-1";

  return (
    <div className="flex flex-col gap-3">
      {npcs.length === 0 && !showForm && (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-8 text-center">
          <p className="text-sm text-coc-muted">このシナリオにNPCはまだ登録されていません。</p>
        </div>
      )}

      {npcs.map((npc) => (
        <div
          key={npc.id}
          className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <Link
                  href={`/npcs/${npc.id}`}
                  className="font-medium text-coc-text hover:text-coc-gold transition-colors"
                >
                  {npc.name}
                </Link>
                {npc.faction && (
                  <span className="rounded-full border border-coc-border px-2 py-0.5 text-xs text-coc-muted">
                    {npc.faction}
                  </span>
                )}
              </div>
              {npc.purpose && (
                <p className="text-xs text-coc-muted line-clamp-2">{npc.purpose}</p>
              )}
              {!npc.purpose && npc.appearance && (
                <p className="text-xs text-coc-muted line-clamp-2">{npc.appearance}</p>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link
                href={`/npcs/${npc.id}`}
                className="flex items-center gap-1 text-xs text-coc-muted hover:text-coc-gold transition-colors"
              >
                詳細
                <ChevronRight size={13} />
              </Link>
              <button
                onClick={() => handleDelete(npc.id)}
                disabled={deleting === npc.id}
                className="text-coc-muted hover:text-red-400 transition-colors disabled:opacity-50"
                aria-label="削除"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      ))}

      {showForm ? (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-coc-text">NPC を追加</h3>
            <button
              onClick={() => { setShowForm(false); resetForm(); }}
              className="text-coc-muted hover:text-coc-text transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleAdd} className="flex flex-col gap-4">
            {error && (
              <p className="rounded-lg border border-red-800 bg-red-950/40 px-3 py-2 text-xs text-red-400">
                {error}
              </p>
            )}

            <div>
              <label className={labelClass}>
                NPC名 <span className="text-coc-gold">*</span>
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="例: ザドック・アレン"
                required
                className={fieldClass}
              />
            </div>

            <div>
              <label className={labelClass}>陣営 / 組織</label>
              <input
                name="faction"
                value={form.faction}
                onChange={handleChange}
                placeholder="例: カルト教団, 一般市民"
                className={fieldClass}
              />
            </div>

            <div>
              <label className={labelClass}>目的・役割</label>
              <textarea
                name="purpose"
                value={form.purpose}
                onChange={handleChange}
                placeholder="シナリオ内での目的や役割"
                rows={2}
                className={fieldClass}
              />
            </div>

            <div>
              <label className={labelClass}>外見</label>
              <textarea
                name="appearance"
                value={form.appearance}
                onChange={handleChange}
                placeholder="容姿・服装・特徴など"
                rows={2}
                className={fieldClass}
              />
            </div>

            <div>
              <label className={labelClass}>メモ</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="KP用の秘密メモ"
                rows={2}
                className={fieldClass}
              />
            </div>

            <p className="text-xs text-coc-muted">
              能力値・口調など詳細は{" "}
              <Link
                href={`/npcs/new`}
                className="text-coc-gold hover:underline"
              >
                NPC登録ページ
              </Link>
              から追加できます。
            </p>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => { setShowForm(false); resetForm(); }}
                className="rounded-lg border border-coc-border px-4 py-2 text-sm text-coc-muted hover:text-coc-text hover:border-coc-muted transition-colors"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg border border-coc-gold-dim bg-coc-raised px-4 py-2 text-sm text-coc-gold hover:bg-coc-surface hover:border-coc-gold transition-colors disabled:opacity-50"
              >
                {saving ? "追加中..." : "追加"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-coc-border px-5 py-4 text-sm text-coc-muted hover:border-coc-gold hover:text-coc-gold transition-colors"
        >
          <Plus size={16} />
          NPC を追加
        </button>
      )}
    </div>
  );
}
