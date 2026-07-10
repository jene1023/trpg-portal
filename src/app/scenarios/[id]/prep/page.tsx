"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, X, CheckCircle2, Circle, ChevronUp, ChevronDown, ClipboardList, Download } from "lucide-react";
import { supabase, isSupabaseConfigured, ScenarioPrepTask, PrepTaskTemplate } from "@/lib/supabase";

type Props = { params: Promise<{ id: string }> };

export default function ScenarioPrepPage({ params }: Props) {
  const [scenarioId, setScenarioId] = useState("");
  const [scenarioTitle, setScenarioTitle] = useState("");
  const [tasks, setTasks] = useState<ScenarioPrepTask[]>([]);
  const [templates, setTemplates] = useState<PrepTaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  const [saving, setSaving] = useState(false);
  const [templateMsg, setTemplateMsg] = useState("");

  useEffect(() => {
    params.then(({ id }) => {
      setScenarioId(id);
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }
      Promise.all([
        supabase.from("scenarios").select("title").eq("id", id).single(),
        supabase
          .from("scenario_prep_tasks")
          .select("*")
          .eq("scenario_id", id)
          .order("sort_order", { ascending: true }),
        supabase
          .from("prep_task_templates")
          .select("*")
          .order("sort_order", { ascending: true }),
      ]).then(([scenarioRes, tasksRes, templatesRes]) => {
        if (scenarioRes.data) setScenarioTitle(scenarioRes.data.title);
        setTasks((tasksRes.data ?? []) as ScenarioPrepTask[]);
        setTemplates((templatesRes.data ?? []) as PrepTaskTemplate[]);
        setLoading(false);
      });
    });
  }, [params]);

  async function addTask() {
    if (!newTaskName.trim() || !isSupabaseConfigured) return;
    setSaving(true);
    const maxOrder = tasks.length > 0 ? Math.max(...tasks.map((t) => t.sort_order)) : -1;
    const { data, error } = await supabase
      .from("scenario_prep_tasks")
      .insert({
        scenario_id: scenarioId,
        task_name: newTaskName.trim(),
        is_done: false,
        sort_order: maxOrder + 1,
      })
      .select()
      .single();
    if (!error && data) {
      setTasks((prev) => [...prev, data as ScenarioPrepTask]);
      setNewTaskName("");
      setAdding(false);
    }
    setSaving(false);
  }

  async function toggleDone(id: string, current: boolean) {
    if (!isSupabaseConfigured) return;
    await supabase.from("scenario_prep_tasks").update({ is_done: !current }).eq("id", id);
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, is_done: !current } : t)));
  }

  async function deleteTask(id: string) {
    if (!isSupabaseConfigured) return;
    await supabase.from("scenario_prep_tasks").delete().eq("id", id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  async function moveTask(index: number, direction: -1 | 1) {
    if (!isSupabaseConfigured) return;
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= tasks.length) return;
    const updated = [...tasks];
    const aOrder = updated[index].sort_order;
    const bOrder = updated[swapIndex].sort_order;
    await Promise.all([
      supabase.from("scenario_prep_tasks").update({ sort_order: bOrder }).eq("id", updated[index].id),
      supabase.from("scenario_prep_tasks").update({ sort_order: aOrder }).eq("id", updated[swapIndex].id),
    ]);
    updated[index] = { ...updated[index], sort_order: bOrder };
    updated[swapIndex] = { ...updated[swapIndex], sort_order: aOrder };
    const sorted = [...updated].sort((a, b) => a.sort_order - b.sort_order);
    setTasks(sorted);
  }

  async function saveAsTemplate() {
    if (!isSupabaseConfigured || tasks.length === 0) return;
    setSaving(true);
    await supabase.from("prep_task_templates").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    const rows = tasks.map((t, i) => ({ task_name: t.task_name, sort_order: i }));
    const { data } = await supabase.from("prep_task_templates").insert(rows).select();
    if (data) {
      setTemplates(data as PrepTaskTemplate[]);
      setTemplateMsg("テンプレートを保存しました");
      setTimeout(() => setTemplateMsg(""), 3000);
    }
    setSaving(false);
  }

  async function loadFromTemplate() {
    if (!isSupabaseConfigured || templates.length === 0) return;
    setSaving(true);
    const maxOrder = tasks.length > 0 ? Math.max(...tasks.map((t) => t.sort_order)) : -1;
    const rows = templates.map((t, i) => ({
      scenario_id: scenarioId,
      task_name: t.task_name,
      is_done: false,
      sort_order: maxOrder + 1 + i,
    }));
    const { data } = await supabase.from("scenario_prep_tasks").insert(rows).select();
    if (data) {
      setTasks((prev) => [...prev, ...(data as ScenarioPrepTask[])].sort((a, b) => a.sort_order - b.sort_order));
      setTemplateMsg("テンプレートを読み込みました");
      setTimeout(() => setTemplateMsg(""), 3000);
    }
    setSaving(false);
  }

  const doneCount = tasks.filter((t) => t.is_done).length;

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-coc-muted text-sm">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <Link
          href={`/scenarios/${scenarioId}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          {scenarioTitle || "シナリオ詳細"}
        </Link>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 rounded-lg border border-coc-gold/60 bg-coc-gold/10 px-3 py-1.5 text-sm text-coc-gold hover:bg-coc-gold/20 transition-colors"
        >
          <Plus size={14} />
          タスクを追加
        </button>
      </div>

      <h1 className="font-cinzel text-xl font-bold text-coc-text mb-1">準備チェックリスト</h1>
      <p className="text-xs text-coc-muted mb-4">
        セッション前の準備タスクを登録し、当日チェックしながら消化します。
      </p>

      {tasks.length > 0 && (
        <div className="mb-4 flex items-center gap-3">
          <div className="flex-1 rounded-full bg-coc-border h-1.5 overflow-hidden">
            <div
              className="h-full bg-coc-gold rounded-full transition-all"
              style={{ width: `${tasks.length > 0 ? (doneCount / tasks.length) * 100 : 0}%` }}
            />
          </div>
          <span className="text-xs text-coc-muted whitespace-nowrap">
            {doneCount} / {tasks.length} 完了
          </span>
        </div>
      )}

      {/* テンプレートアクション */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tasks.length > 0 && (
          <button
            onClick={saveAsTemplate}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg border border-coc-border px-3 py-1.5 text-xs text-coc-muted hover:text-coc-text hover:border-coc-border-glow transition-colors disabled:opacity-50"
          >
            <ClipboardList size={13} />
            テンプレートとして保存
          </button>
        )}
        {templates.length > 0 && (
          <button
            onClick={loadFromTemplate}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg border border-coc-border px-3 py-1.5 text-xs text-coc-muted hover:text-coc-text hover:border-coc-border-glow transition-colors disabled:opacity-50"
          >
            <Download size={13} />
            テンプレートを読み込む ({templates.length}件)
          </button>
        )}
        {templateMsg && (
          <span className="self-center text-xs text-green-400">{templateMsg}</span>
        )}
      </div>

      {/* 追加フォーム */}
      {adding && (
        <div className="mb-4 rounded-lg border border-coc-gold/40 bg-coc-gold/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-coc-gold">タスクを追加</h2>
            <button onClick={() => setAdding(false)} className="text-coc-muted hover:text-coc-text transition-colors">
              <X size={16} />
            </button>
          </div>
          <input
            type="text"
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            placeholder="タスク名（例: ハンドアウト印刷）"
            className="w-full rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text placeholder-coc-muted focus:outline-none focus:border-coc-gold/60"
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={addTask}
              disabled={saving || !newTaskName.trim()}
              className="rounded-lg border border-coc-gold/60 bg-coc-gold/10 px-4 py-2 text-sm font-semibold text-coc-gold hover:bg-coc-gold/20 disabled:opacity-50 transition-colors"
            >
              {saving ? "保存中..." : "追加"}
            </button>
            <button
              onClick={() => { setAdding(false); setNewTaskName(""); }}
              className="rounded-lg border border-coc-border px-4 py-2 text-sm text-coc-muted hover:text-coc-text transition-colors"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* タスクリスト */}
      {tasks.length === 0 && !adding ? (
        <div className="rounded-lg border border-coc-border bg-coc-surface p-8 text-center">
          <p className="text-coc-muted text-sm">準備タスクがまだありません。</p>
          <p className="text-xs text-coc-muted mt-1">右上の「タスクを追加」から登録できます。</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task, index) => (
            <div
              key={task.id}
              className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${
                task.is_done
                  ? "border-coc-border bg-coc-surface opacity-60"
                  : "border-coc-border bg-coc-surface hover:border-coc-border-glow"
              }`}
            >
              <button
                onClick={() => toggleDone(task.id, task.is_done)}
                className="flex-shrink-0 transition-colors"
              >
                {task.is_done ? (
                  <CheckCircle2 size={18} className="text-green-400" />
                ) : (
                  <Circle size={18} className="text-coc-muted hover:text-coc-text" />
                )}
              </button>

              <span
                className={`flex-1 text-sm ${
                  task.is_done ? "line-through text-coc-muted" : "text-coc-text"
                }`}
              >
                {task.task_name}
              </span>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => moveTask(index, -1)}
                  disabled={index === 0}
                  className="rounded p-0.5 text-coc-muted hover:text-coc-text disabled:opacity-30 transition-colors"
                  title="上へ"
                >
                  <ChevronUp size={15} />
                </button>
                <button
                  onClick={() => moveTask(index, 1)}
                  disabled={index === tasks.length - 1}
                  className="rounded p-0.5 text-coc-muted hover:text-coc-text disabled:opacity-30 transition-colors"
                  title="下へ"
                >
                  <ChevronDown size={15} />
                </button>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="rounded p-0.5 text-coc-muted hover:text-red-400 transition-colors ml-1"
                  title="削除"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
