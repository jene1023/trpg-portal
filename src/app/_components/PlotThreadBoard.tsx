"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { supabase, isSupabaseConfigured, PlotThread, PlotThreadStatus } from "@/lib/supabase";

const STATUS_LABELS: Record<PlotThreadStatus, string> = {
  pending: "未解明",
  revealed: "解明済み",
  abandoned: "放棄",
};

const STATUS_COLORS: Record<PlotThreadStatus, string> = {
  pending: "border-yellow-700 bg-yellow-950/30 text-yellow-400",
  revealed: "border-green-800 bg-green-950/30 text-green-400",
  abandoned: "border-coc-border bg-coc-raised text-coc-muted",
};

const STATUS_ORDER: PlotThreadStatus[] = ["pending", "revealed", "abandoned"];

type Props = {
  scenarioId: string;
  initialThreads: PlotThread[];
};

export default function PlotThreadBoard({ scenarioId, initialThreads }: Props) {
  const [threads, setThreads] = useState<PlotThread[]>(initialThreads);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  async function addThread() {
    if (!title.trim() || !isSupabaseConfigured) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("plot_threads")
      .insert({
        scenario_id: scenarioId,
        title: title.trim(),
        description: description.trim() || null,
        status: "pending",
      })
      .select()
      .single();
    if (!error && data) {
      setThreads((prev) => [data as PlotThread, ...prev]);
      setTitle("");
      setDescription("");
      setAdding(false);
    }
    setSaving(false);
  }

  async function changeStatus(id: string, status: PlotThreadStatus) {
    if (!isSupabaseConfigured) return;
    await supabase.from("plot_threads").update({ status }).eq("id", id);
    setThreads((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  }

  async function deleteThread(id: string) {
    if (!isSupabaseConfigured) return;
    await supabase.from("plot_threads").delete().eq("id", id);
    setThreads((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {STATUS_ORDER.map((status) => {
          const items = threads.filter((t) => t.status === status);
          return (
            <div key={status} className="rounded-xl border border-coc-border bg-coc-surface p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${STATUS_COLORS[status]}`}>
                  {STATUS_LABELS[status]}
                </span>
                <span className="text-xs text-coc-muted">{items.length}件</span>
              </div>
              <div className="space-y-2">
                {items.map((thread) => (
                  <div
                    key={thread.id}
                    className="rounded-lg border border-coc-border bg-coc-bg p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-coc-text">{thread.title}</p>
                        {thread.description && (
                          <p className="mt-1 text-xs text-coc-muted whitespace-pre-wrap">
                            {thread.description}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => deleteThread(thread.id)}
                        className="p-1 rounded hover:bg-coc-raised text-red-400 transition-colors shrink-0"
                        aria-label="削除"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="mt-2 flex gap-1 flex-wrap">
                      {STATUS_ORDER.filter((s) => s !== status).map((s) => (
                        <button
                          key={s}
                          onClick={() => changeStatus(thread.id, s)}
                          className="rounded px-2 py-0.5 text-xs border border-coc-border text-coc-muted hover:border-coc-gold hover:text-coc-gold transition-colors"
                        >
                          {STATUS_LABELS[s]}へ
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {items.length === 0 && (
                  <p className="text-center text-xs text-coc-muted py-4">なし</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div>
        {adding ? (
          <div className="rounded-xl border border-coc-gold-dim bg-coc-raised px-5 py-4 space-y-3">
            <input
              type="text"
              placeholder="謎・伏線のタイトル（例: 老教授の失踪の真相）"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text placeholder-coc-muted focus:border-coc-gold focus:outline-none"
              autoFocus
            />
            <textarea
              placeholder="詳細説明（任意）"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text placeholder-coc-muted focus:border-coc-gold focus:outline-none resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={addThread}
                disabled={!title.trim() || saving}
                className="flex-1 rounded-lg bg-coc-gold py-2 text-sm font-medium text-black disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                {saving ? "保存中..." : "追加"}
              </button>
              <button
                onClick={() => {
                  setAdding(false);
                  setTitle("");
                  setDescription("");
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
            謎・伏線を追加
          </button>
        )}
      </div>
    </div>
  );
}
