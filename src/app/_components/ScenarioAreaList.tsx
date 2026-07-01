"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, Trash2, Plus } from "lucide-react";
import { supabase, isSupabaseConfigured, ScenarioArea } from "@/lib/supabase";

type Props = {
  scenarioId: string;
  initialAreas: ScenarioArea[];
};

export default function ScenarioAreaList({ scenarioId, initialAreas }: Props) {
  const [areas, setAreas] = useState<ScenarioArea[]>(initialAreas);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [gmNotes, setGmNotes] = useState("");
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  async function addArea() {
    if (!name.trim() || !isSupabaseConfigured) return;
    setSaving(true);
    const maxIndex = areas.length > 0 ? Math.max(...areas.map((a) => a.order_index)) : -1;
    const { data, error } = await supabase
      .from("scenario_areas")
      .insert({
        scenario_id: scenarioId,
        name: name.trim(),
        description: description.trim() || null,
        gm_notes: gmNotes.trim() || null,
        order_index: maxIndex + 1,
      })
      .select()
      .single();
    if (!error && data) {
      setAreas((prev) => [...prev, data as ScenarioArea]);
      setName("");
      setDescription("");
      setGmNotes("");
      setAdding(false);
    }
    setSaving(false);
  }

  async function deleteArea(id: string) {
    if (!isSupabaseConfigured) return;
    await supabase.from("scenario_areas").delete().eq("id", id);
    setAreas((prev) => prev.filter((a) => a.id !== id));
  }

  async function moveArea(index: number, direction: -1 | 1) {
    if (!isSupabaseConfigured) return;
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= areas.length) return;

    const updated = [...areas];
    const aIdx = updated[index].order_index;
    const bIdx = updated[swapIndex].order_index;

    await Promise.all([
      supabase.from("scenario_areas").update({ order_index: bIdx }).eq("id", updated[index].id),
      supabase.from("scenario_areas").update({ order_index: aIdx }).eq("id", updated[swapIndex].id),
    ]);

    updated[index] = { ...updated[index], order_index: bIdx };
    updated[swapIndex] = { ...updated[swapIndex], order_index: aIdx };
    updated.sort((a, b) => a.order_index - b.order_index);
    setAreas(updated);
  }

  return (
    <div className="space-y-3">
      {areas.map((area, i) => (
        <div key={area.id} className="rounded-xl border border-coc-border bg-coc-surface overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 gap-3">
            <h3 className="font-medium text-coc-text flex-1">{area.name}</h3>
            <div className="flex items-center gap-1">
              <button
                onClick={() => moveArea(i, -1)}
                disabled={i === 0}
                className="p-1 rounded hover:bg-coc-raised text-coc-muted disabled:opacity-30 transition-colors"
                aria-label="上へ"
              >
                <ChevronUp size={16} />
              </button>
              <button
                onClick={() => moveArea(i, 1)}
                disabled={i === areas.length - 1}
                className="p-1 rounded hover:bg-coc-raised text-coc-muted disabled:opacity-30 transition-colors"
                aria-label="下へ"
              >
                <ChevronDown size={16} />
              </button>
              <button
                onClick={() => deleteArea(area.id)}
                className="p-1 rounded hover:bg-coc-raised text-red-400 transition-colors"
                aria-label="削除"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
          {area.description && (
            <p className="px-4 pb-2 text-sm text-coc-muted whitespace-pre-wrap">{area.description}</p>
          )}
          {area.gm_notes && (
            <details className="px-4 pb-3">
              <summary className="cursor-pointer text-xs text-coc-muted hover:text-coc-text select-none">
                GMメモを表示
              </summary>
              <p className="mt-2 text-sm text-coc-text whitespace-pre-wrap border-t border-coc-border pt-2">
                {area.gm_notes}
              </p>
            </details>
          )}
        </div>
      ))}

      {areas.length === 0 && !adding && (
        <p className="text-center text-sm text-coc-muted py-8">エリアがまだ登録されていません</p>
      )}

      {adding ? (
        <div className="rounded-xl border border-coc-gold-dim bg-coc-raised px-5 py-4 space-y-3">
          <input
            type="text"
            placeholder="エリア名（例: 図書館、古い屋敷）"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text placeholder-coc-muted focus:border-coc-gold focus:outline-none"
          />
          <textarea
            placeholder="説明（プレイヤーに見せてもよい情報）"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text placeholder-coc-muted focus:border-coc-gold focus:outline-none resize-none"
          />
          <textarea
            placeholder="GMメモ（KP専用の非公開メモ）"
            value={gmNotes}
            onChange={(e) => setGmNotes(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text placeholder-coc-muted focus:border-coc-gold focus:outline-none resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={addArea}
              disabled={!name.trim() || saving}
              className="flex-1 rounded-lg bg-coc-gold py-2 text-sm font-medium text-black disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              {saving ? "保存中..." : "追加"}
            </button>
            <button
              onClick={() => { setAdding(false); setName(""); setDescription(""); setGmNotes(""); }}
              className="rounded-lg border border-coc-border px-4 py-2 text-sm text-coc-muted hover:text-coc-text transition-colors"
            >
              キャンセル
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-coc-border py-3 text-sm text-coc-muted hover:border-coc-gold hover:text-coc-gold transition-colors"
        >
          <Plus size={16} />
          エリアを追加
        </button>
      )}
    </div>
  );
}
