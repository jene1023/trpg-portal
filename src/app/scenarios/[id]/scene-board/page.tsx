"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, CheckCircle2, Circle, GripVertical } from "lucide-react";
import { supabase, isSupabaseConfigured, KanbanScene, ScenePhase } from "@/lib/supabase";

const PHASES: { key: ScenePhase; label: string; color: string }[] = [
  { key: "opening", label: "オープニング", color: "border-blue-700 bg-blue-950/20" },
  { key: "investigation", label: "調査", color: "border-yellow-700 bg-yellow-950/20" },
  { key: "climax", label: "クライマックス", color: "border-red-700 bg-red-950/20" },
  { key: "ending", label: "エンディング", color: "border-green-700 bg-green-950/20" },
  { key: "optional", label: "任意", color: "border-coc-border bg-coc-surface" },
];

type AddingState = { phase: ScenePhase; title: string; description: string } | null;

export default function SceneBoardPage() {
  const params = useParams();
  const scenarioId = params.id as string;

  const [scenes, setScenes] = useState<KanbanScene[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<AddingState>(null);
  const [saving, setSaving] = useState(false);

  const dragScene = useRef<KanbanScene | null>(null);
  const dragOverPhase = useRef<ScenePhase | null>(null);
  const dragOverIndex = useRef<number>(-1);

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    supabase
      .from("scenario_kanban_scenes")
      .select("*")
      .eq("scenario_id", scenarioId)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        setScenes((data ?? []) as KanbanScene[]);
        setLoading(false);
      });
  }, [scenarioId]);

  function scenesForPhase(phase: ScenePhase) {
    return scenes.filter((s) => s.phase === phase).sort((a, b) => a.sort_order - b.sort_order);
  }

  async function addScene() {
    if (!adding || !adding.title.trim() || !isSupabaseConfigured) return;
    setSaving(true);
    const phaseScenes = scenesForPhase(adding.phase);
    const maxOrder = phaseScenes.length > 0 ? Math.max(...phaseScenes.map((s) => s.sort_order)) : -1;
    const { data, error } = await supabase
      .from("scenario_kanban_scenes")
      .insert({
        scenario_id: scenarioId,
        title: adding.title.trim(),
        description: adding.description.trim() || null,
        phase: adding.phase,
        sort_order: maxOrder + 1,
        is_completed: false,
        linked_area_id: null,
      })
      .select()
      .single();
    if (!error && data) {
      setScenes((prev) => [...prev, data as KanbanScene]);
    }
    setAdding(null);
    setSaving(false);
  }

  async function toggleComplete(scene: KanbanScene) {
    if (!isSupabaseConfigured) return;
    const next = !scene.is_completed;
    await supabase.from("scenario_kanban_scenes").update({ is_completed: next }).eq("id", scene.id);
    setScenes((prev) => prev.map((s) => (s.id === scene.id ? { ...s, is_completed: next } : s)));
  }

  async function deleteScene(id: string) {
    if (!isSupabaseConfigured) return;
    await supabase.from("scenario_kanban_scenes").delete().eq("id", id);
    setScenes((prev) => prev.filter((s) => s.id !== id));
  }

  function handleDragStart(scene: KanbanScene) {
    dragScene.current = scene;
  }

  function handleDragOver(e: DragEvent, phase: ScenePhase, index: number) {
    e.preventDefault();
    dragOverPhase.current = phase;
    dragOverIndex.current = index;
  }

  async function handleDrop(e: DragEvent, targetPhase: ScenePhase, targetIndex: number) {
    e.preventDefault();
    const dragged = dragScene.current;
    if (!dragged || !isSupabaseConfigured) return;

    const targetPhaseScenes = scenesForPhase(targetPhase).filter((s) => s.id !== dragged.id);
    targetPhaseScenes.splice(targetIndex, 0, { ...dragged, phase: targetPhase });

    const updates = targetPhaseScenes.map((s, i) => ({ id: s.id, sort_order: i, phase: targetPhase }));

    setScenes((prev) => {
      const without = prev.filter((s) => s.id !== dragged.id);
      const reordered = targetPhaseScenes.map((s, i) => ({ ...s, sort_order: i, phase: targetPhase }));
      return [...without, ...reordered];
    });

    await Promise.all(
      updates.map(({ id, sort_order, phase }) =>
        supabase.from("scenario_kanban_scenes").update({ sort_order, phase }).eq("id", id)
      )
    );

    dragScene.current = null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-coc-muted text-sm">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen coc-page-enter px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link
            href={`/scenarios/${scenarioId}`}
            className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
          >
            <ArrowLeft size={16} />
            シナリオ詳細
          </Link>
          <span className="text-coc-border">/</span>
          <h1 className="font-cinzel text-lg font-bold text-coc-text">シーンボード</h1>
        </div>

        {!isSupabaseConfigured && (
          <div className="mb-4 rounded-lg border border-yellow-800 bg-yellow-950/20 px-4 py-3 text-sm text-yellow-300">
            Supabase が未設定です。データは保存されません。
          </div>
        )}

        <div className="flex gap-4 overflow-x-auto pb-4">
          {PHASES.map((phase) => {
            const phaseScenes = scenesForPhase(phase.key);
            const isAddingThis = adding?.phase === phase.key;

            return (
              <div
                key={phase.key}
                className={`flex-shrink-0 w-64 rounded-xl border-2 ${phase.color} flex flex-col`}
                onDragOver={(e) => handleDragOver(e, phase.key, phaseScenes.length)}
                onDrop={(e) => handleDrop(e, phase.key, phaseScenes.length)}
              >
                {/* Column header */}
                <div className="px-4 py-3 border-b border-coc-border">
                  <div className="flex items-center justify-between">
                    <h2 className="font-medium text-sm text-coc-text">{phase.label}</h2>
                    <span className="text-xs text-coc-muted rounded-full bg-coc-raised px-2 py-0.5">
                      {phaseScenes.length}
                    </span>
                  </div>
                </div>

                {/* Cards */}
                <div className="flex-1 p-3 space-y-2 min-h-[120px]">
                  {phaseScenes.map((scene, index) => (
                    <div
                      key={scene.id}
                      draggable
                      onDragStart={() => handleDragStart(scene)}
                      onDragOver={(e) => { e.stopPropagation(); handleDragOver(e, phase.key, index); }}
                      onDrop={(e) => { e.stopPropagation(); handleDrop(e, phase.key, index); }}
                      className={`rounded-lg border bg-coc-surface px-3 py-2.5 cursor-grab active:cursor-grabbing transition-opacity ${
                        scene.is_completed ? "opacity-50 border-coc-border" : "border-coc-border hover:border-coc-gold-dim"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical size={14} className="text-coc-muted mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-medium leading-snug ${
                              scene.is_completed ? "line-through text-coc-muted" : "text-coc-text"
                            }`}
                          >
                            {scene.title}
                          </p>
                          {scene.description && (
                            <p className="text-xs text-coc-muted mt-1 leading-snug line-clamp-2">
                              {scene.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-1 mt-2">
                        <button
                          onClick={() => toggleComplete(scene)}
                          className="p-1 rounded hover:bg-coc-raised text-coc-muted hover:text-coc-gold transition-colors"
                          aria-label={scene.is_completed ? "未完了に戻す" : "完了にする"}
                        >
                          {scene.is_completed ? (
                            <CheckCircle2 size={14} className="text-green-400" />
                          ) : (
                            <Circle size={14} />
                          )}
                        </button>
                        <button
                          onClick={() => deleteScene(scene.id)}
                          className="p-1 rounded hover:bg-coc-raised text-coc-muted hover:text-red-400 transition-colors"
                          aria-label="削除"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Drop zone when empty */}
                  {phaseScenes.length === 0 && !isAddingThis && (
                    <div
                      className="h-12 rounded-lg border border-dashed border-coc-border flex items-center justify-center"
                      onDragOver={(e) => handleDragOver(e, phase.key, 0)}
                      onDrop={(e) => handleDrop(e, phase.key, 0)}
                    >
                      <span className="text-xs text-coc-muted">カードをドロップ</span>
                    </div>
                  )}
                </div>

                {/* Add scene area */}
                <div className="px-3 pb-3">
                  {isAddingThis ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="シーンタイトル"
                        value={adding.title}
                        onChange={(e) => setAdding({ ...adding, title: e.target.value })}
                        onKeyDown={(e) => { if (e.key === "Enter") addScene(); if (e.key === "Escape") setAdding(null); }}
                        className="w-full rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text placeholder-coc-muted focus:border-coc-gold focus:outline-none"
                        autoFocus
                      />
                      <textarea
                        placeholder="説明（任意）"
                        value={adding.description}
                        onChange={(e) => setAdding({ ...adding, description: e.target.value })}
                        rows={2}
                        className="w-full rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-xs text-coc-text placeholder-coc-muted focus:border-coc-gold focus:outline-none resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={addScene}
                          disabled={!adding.title.trim() || saving}
                          className="flex-1 rounded-lg bg-coc-gold py-1.5 text-xs font-medium text-black disabled:opacity-50 hover:opacity-90 transition-opacity"
                        >
                          {saving ? "保存中..." : "追加"}
                        </button>
                        <button
                          onClick={() => setAdding(null)}
                          className="rounded-lg border border-coc-border px-3 py-1.5 text-xs text-coc-muted hover:text-coc-text transition-colors"
                        >
                          キャンセル
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAdding({ phase: phase.key, title: "", description: "" })}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-coc-border py-2 text-xs text-coc-muted hover:border-coc-gold hover:text-coc-gold transition-colors"
                    >
                      <Plus size={13} />
                      シーンを追加
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-xs text-coc-muted">
          カードをドラッグ＆ドロップで列間移動・並び替えができます。チェックで達成済みにマークされます。
        </p>
      </div>
    </div>
  );
}
