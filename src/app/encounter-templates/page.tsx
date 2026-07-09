"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Layers, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import {
  supabase,
  isSupabaseConfigured,
  Creature,
  EncounterTemplateWithEntries,
} from "@/lib/supabase";

type CreatureRow = Pick<Creature, "id" | "name" | "hp" | "dex">;

type EntryDraft = {
  creature_id: string;
  count: number;
};

export default function EncounterTemplatesPage() {
  const [templates, setTemplates] = useState<EncounterTemplateWithEntries[]>([]);
  const [creatures, setCreatures] = useState<CreatureRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [entries, setEntries] = useState<EntryDraft[]>([{ creature_id: "", count: 1 }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [{ data: tplData }, { data: creatureData }] = await Promise.all([
      supabase
        .from("encounter_templates")
        .select("*, encounter_template_entries(*, creatures(id, name, hp, dex))")
        .order("created_at", { ascending: false }),
      supabase.from("creatures").select("id, name, hp, dex").order("name"),
    ]);
    setTemplates((tplData ?? []) as EncounterTemplateWithEntries[]);
    setCreatures(((creatureData ?? []) as CreatureRow[]).filter((c) => c.hp !== null));
    setLoading(false);
  }

  async function createTemplate() {
    if (!newName.trim() || !isSupabaseConfigured) return;
    const validEntries = entries.filter((e) => e.creature_id);
    if (validEntries.length === 0) return;

    setSaving(true);
    const { data: tpl, error } = await supabase
      .from("encounter_templates")
      .insert({ name: newName.trim() })
      .select()
      .single();

    if (error || !tpl) {
      setSaving(false);
      return;
    }

    await supabase.from("encounter_template_entries").insert(
      validEntries.map((e) => ({
        template_id: tpl.id,
        creature_id: e.creature_id,
        count: e.count,
      }))
    );

    setNewName("");
    setEntries([{ creature_id: "", count: 1 }]);
    setShowForm(false);
    setSaving(false);
    await loadData();
  }

  async function deleteTemplate(id: string) {
    if (!isSupabaseConfigured) return;
    await supabase.from("encounter_template_entries").delete().eq("template_id", id);
    await supabase.from("encounter_templates").delete().eq("id", id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }

  function addEntry() {
    setEntries((prev) => [...prev, { creature_id: "", count: 1 }]);
  }

  function removeEntry(idx: number) {
    setEntries((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateEntry(idx: number, patch: Partial<EntryDraft>) {
    setEntries((prev) => prev.map((e, i) => (i === idx ? { ...e, ...patch } : e)));
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-sm text-coc-muted">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          ホーム
        </Link>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-cinzel text-xl font-bold text-coc-text flex items-center gap-2">
            <Layers size={20} className="text-coc-gold" />
            エンカウンターテンプレート
          </h1>
          <p className="text-xs text-coc-muted mt-1">
            複数クリーチャーのセットをテンプレートとして保存し、戦闘管理にワンクリックで展開できます
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg border border-coc-gold bg-coc-gold/10 px-3 py-1.5 text-sm font-medium text-coc-gold hover:bg-coc-gold/20 transition-colors"
        >
          {showForm ? <ChevronUp size={15} /> : <Plus size={15} />}
          {showForm ? "閉じる" : "新規作成"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="mb-6 rounded-xl border border-coc-gold-dim bg-coc-surface px-5 py-5">
          <p className="text-sm font-medium text-coc-text mb-4">テンプレートを作成</p>

          <div className="mb-4">
            <label className="block text-xs text-coc-muted mb-1">テンプレート名</label>
            <input
              type="text"
              placeholder="例: 深きものども×3 + 星の落とし子×1"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:outline-none focus:border-coc-gold"
            />
          </div>

          <div className="mb-4">
            <label className="block text-xs text-coc-muted mb-2">クリーチャー構成</label>
            <div className="flex flex-col gap-2">
              {entries.map((entry, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <select
                    value={entry.creature_id}
                    onChange={(e) => updateEntry(idx, { creature_id: e.target.value })}
                    className="flex-1 rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text focus:outline-none focus:border-coc-gold"
                  >
                    <option value="">クリーチャーを選択</option>
                    {creatures.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (DEX {c.dex ?? "-"} / HP {c.hp})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={entry.count}
                    onChange={(e) =>
                      updateEntry(idx, { count: Math.max(1, parseInt(e.target.value) || 1) })
                    }
                    className="w-16 rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text text-center focus:outline-none focus:border-coc-gold"
                  />
                  <span className="text-xs text-coc-muted">体</span>
                  {entries.length > 1 && (
                    <button
                      onClick={() => removeEntry(idx)}
                      className="text-coc-muted hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={addEntry}
              className="mt-2 text-xs text-coc-muted hover:text-coc-gold transition-colors flex items-center gap-1"
            >
              <Plus size={12} />
              クリーチャーを追加
            </button>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setShowForm(false);
                setNewName("");
                setEntries([{ creature_id: "", count: 1 }]);
              }}
              className="rounded-lg border border-coc-border px-4 py-2 text-sm text-coc-muted hover:text-coc-text transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={createTemplate}
              disabled={saving || !newName.trim() || entries.every((e) => !e.creature_id)}
              className="rounded-lg border border-coc-gold bg-coc-gold/10 px-4 py-2 text-sm text-coc-gold hover:bg-coc-gold/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? "保存中..." : "保存"}
            </button>
          </div>
        </div>
      )}

      {/* Template list */}
      {templates.length === 0 ? (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-10 text-center">
          <Layers size={32} className="text-coc-muted mx-auto mb-3" />
          <p className="text-sm text-coc-muted">テンプレートがまだありません。</p>
          <p className="text-xs text-coc-muted mt-1">
            クリーチャーをセットで保存すると戦闘管理から呼び出せます。
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="font-medium text-coc-text">{tpl.name}</p>
                  <p className="text-xs text-coc-muted mt-0.5">
                    {tpl.encounter_template_entries.length} 種類のクリーチャー
                  </p>
                </div>
                <button
                  onClick={() => deleteTemplate(tpl.id)}
                  className="text-coc-muted hover:text-red-400 transition-colors flex-shrink-0"
                  aria-label="削除"
                >
                  <Trash2 size={15} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tpl.encounter_template_entries.map((entry) => (
                  <span
                    key={entry.id}
                    className="rounded-full border border-coc-border bg-coc-raised px-3 py-1 text-xs text-coc-text"
                  >
                    {entry.creatures.name}
                    <span className="ml-1 text-coc-muted">×{entry.count}</span>
                    {entry.creatures.hp !== null && (
                      <span className="ml-1 text-coc-muted">HP{entry.creatures.hp}</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
