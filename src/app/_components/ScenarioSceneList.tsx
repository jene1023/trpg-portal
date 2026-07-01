"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, Trash2, Plus, CheckCircle2, Circle } from "lucide-react";
import { supabase, isSupabaseConfigured, ScenarioScene } from "@/lib/supabase";

type Props = {
  scenarioId: string;
  initialScenes: ScenarioScene[];
};

export default function ScenarioSceneList({ scenarioId, initialScenes }: Props) {
  const [scenes, setScenes] = useState<ScenarioScene[]>(initialScenes);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  async function addScene() {
    if (!title.trim() || !isSupabaseConfigured) return;
    setSaving(true);
    const maxOrder = scenes.length > 0 ? Math.max(...scenes.map((s) => s.scene_order)) : -1;
    const { data, error } = await supabase
      .from("scenario_scenes")
      .insert({
        scenario_id: scenarioId,
        title: title.trim(),
        notes: notes.trim() || null,
        scene_order: maxOrder + 1,
        is_done: false,
      })
      .select()
      .single();
    if (!error && data) {
      setScenes((prev) => [...prev, data as ScenarioScene]);
      setTitle("");
      setNotes("");
      setAdding(false);
    }
    setSaving(false);
  }

  async function deleteScene(id: string) {
    if (!isSupabaseConfigured) return;
    await supabase.from("scenario_scenes").delete().eq("id", id);
    setScenes((prev) => prev.filter((s) => s.id !== id));
  }

  async function toggleDone(id: string, currentDone: boolean) {
    if (!isSupabaseConfigured) return;
    await supabase.from("scenario_scenes").update({ is_done: !currentDone }).eq("id", id);
    setScenes((prev) =>
      prev.map((s) => (s.id === id ? { ...s, is_done: !currentDone } : s))
    );
  }

  async function moveScene(index: number, direction: -1 | 1) {
    if (!isSupabaseConfigured) return;
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= scenes.length) return;

    const updated = [...scenes];
    const aOrder = updated[index].scene_order;
    const bOrder = updated[swapIndex].scene_order;

    await Promise.all([
      supabase.from("scenario_scenes").update({ scene_order: bOrder }).eq("id", updated[index].id),
      supabase.from("scenario_scenes").update({ scene_order: aOrder }).eq("id", updated[swapIndex].id),
    ]);

    updated[index] = { ...updated[index], scene_order: bOrder };
    updated[swapIndex] = { ...updated[swapIndex], scene_order: aOrder };
    updated.sort((a, b) => a.scene_order - b.scene_order);
    setScenes(updated);
  }

  return (
    <div className="space-y-3">
      {scenes.map((scene, i) => (
        <div
          key={scene.id}
          className={`rounded-xl border bg-coc-surface overflow-hidden transition-colors ${
            scene.is_done ? "border-coc-border opacity-60" : "border-coc-border"
          }`}
        >
          <div className="flex items-center justify-between px-4 py-3 gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <button
                onClick={() => toggleDone(scene.id, scene.is_done)}
                className="shrink-0 text-coc-muted hover:text-coc-gold transition-colors"
                aria-label={scene.is_done ? "未完了に戻す" : "完了にする"}
              >
                {scene.is_done ? (
                  <CheckCircle2 size={18} className="text-green-400" />
                ) : (
                  <Circle size={18} />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-coc-muted shrink-0">場面 {i + 1}</span>
                  <h3
                    className={`font-medium truncate ${
                      scene.is_done ? "line-through text-coc-muted" : "text-coc-text"
                    }`}
                  >
                    {scene.title}
                  </h3>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => moveScene(i, -1)}
                disabled={i === 0}
                className="p-1 rounded hover:bg-coc-raised text-coc-muted disabled:opacity-30 transition-colors"
                aria-label="上へ"
              >
                <ChevronUp size={16} />
              </button>
              <button
                onClick={() => moveScene(i, 1)}
                disabled={i === scenes.length - 1}
                className="p-1 rounded hover:bg-coc-raised text-coc-muted disabled:opacity-30 transition-colors"
                aria-label="下へ"
              >
                <ChevronDown size={16} />
              </button>
              <button
                onClick={() => deleteScene(scene.id)}
                className="p-1 rounded hover:bg-coc-raised text-red-400 transition-colors"
                aria-label="削除"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
          {scene.notes && (
            <details className="px-4 pb-3">
              <summary className="cursor-pointer text-xs text-coc-muted hover:text-coc-text select-none">
                ノートを表示
              </summary>
              <p className="mt-2 text-sm text-coc-text whitespace-pre-wrap border-t border-coc-border pt-2">
                {scene.notes}
              </p>
            </details>
          )}
        </div>
      ))}

      {scenes.length === 0 && !adding && (
        <p className="text-center text-sm text-coc-muted py-8">場面がまだ登録されていません</p>
      )}

      {adding ? (
        <div className="rounded-xl border border-coc-gold-dim bg-coc-raised px-5 py-4 space-y-3">
          <input
            type="text"
            placeholder="場面タイトル（例: 場面1: 導入、クライマックス）"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text placeholder-coc-muted focus:border-coc-gold focus:outline-none"
            autoFocus
          />
          <textarea
            placeholder="ノート（場面の説明・GM向け補足、任意）"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text placeholder-coc-muted focus:border-coc-gold focus:outline-none resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={addScene}
              disabled={!title.trim() || saving}
              className="flex-1 rounded-lg bg-coc-gold py-2 text-sm font-medium text-black disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              {saving ? "保存中..." : "追加"}
            </button>
            <button
              onClick={() => {
                setAdding(false);
                setTitle("");
                setNotes("");
              }}
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
          場面を追加
        </button>
      )}
    </div>
  );
}
