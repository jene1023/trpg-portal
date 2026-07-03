"use client";

import { useState, useEffect } from "react";
import { Play, Square, Trash2, Plus, Timer } from "lucide-react";
import { supabase, isSupabaseConfigured, ScenePacingLog } from "@/lib/supabase";

type Props = {
  scenarioId: string;
  initialLogs: ScenePacingLog[];
};

function formatDuration(startedAt: string, endedAt: string | null): string {
  const start = new Date(startedAt).getTime();
  const end = endedAt ? new Date(endedAt).getTime() : Date.now();
  const minutes = Math.floor((end - start) / 60000);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) return `${hours}時間${mins}分`;
  return `${mins}分`;
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ScenePacingList({ scenarioId, initialLogs }: Props) {
  const [logs, setLogs] = useState<ScenePacingLog[]>(initialLogs);
  const [newLabel, setNewLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [tick, setTick] = useState(0);

  const activeLog = logs.find((l) => l.ended_at === null);

  useEffect(() => {
    if (!activeLog) return;
    const interval = setInterval(() => setTick((t) => t + 1), 10000);
    return () => clearInterval(interval);
  }, [activeLog]);

  async function startScene() {
    if (!newLabel.trim() || !isSupabaseConfigured) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("scene_pacing_logs")
      .insert({
        scenario_id: scenarioId,
        scene_label: newLabel.trim(),
        started_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (!error && data) {
      setLogs((prev) => [...prev, data as ScenePacingLog]);
      setNewLabel("");
    }
    setSaving(false);
  }

  async function endScene(id: string) {
    if (!isSupabaseConfigured) return;
    const ended_at = new Date().toISOString();
    const { error } = await supabase
      .from("scene_pacing_logs")
      .update({ ended_at })
      .eq("id", id);
    if (!error) {
      setLogs((prev) =>
        prev.map((l) => (l.id === id ? { ...l, ended_at } : l))
      );
    }
  }

  async function deleteLog(id: string) {
    if (!isSupabaseConfigured) return;
    await supabase.from("scene_pacing_logs").delete().eq("id", id);
    setLogs((prev) => prev.filter((l) => l.id !== id));
  }

  const totalMinutes = logs
    .filter((l) => l.ended_at)
    .reduce((sum, l) => {
      const start = new Date(l.started_at).getTime();
      const end = new Date(l.ended_at!).getTime();
      return sum + Math.floor((end - start) / 60000);
    }, 0);

  return (
    <div className="space-y-4">
      {logs.length > 0 && (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4">
          <p className="text-xs text-coc-muted mb-3 font-cinzel uppercase tracking-widest">シーン一覧</p>
          <div className="space-y-2">
            {logs.map((log, i) => {
              const isActive = log.ended_at === null;
              return (
                <div
                  key={log.id}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${
                    isActive
                      ? "border border-coc-gold bg-coc-gold/5"
                      : "border border-coc-border bg-coc-raised"
                  }`}
                >
                  <span className="text-xs text-coc-muted w-5 shrink-0">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-coc-text truncate">{log.scene_label}</p>
                    <p className="text-xs text-coc-muted mt-0.5">
                      開始: {formatTime(log.started_at)}
                      {log.ended_at && ` → 終了: ${formatTime(log.ended_at)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        isActive
                          ? "bg-coc-gold/10 text-coc-gold"
                          : "bg-coc-raised text-coc-muted"
                      }`}
                    >
                      <Timer size={11} />
                      {/* tick dependency for live updates */}
                      {tick >= 0 && formatDuration(log.started_at, log.ended_at)}
                    </span>
                    {isActive && (
                      <button
                        onClick={() => endScene(log.id)}
                        className="flex items-center gap-1 rounded-lg border border-coc-border px-2 py-1 text-xs text-coc-muted hover:border-coc-gold hover:text-coc-gold transition-colors"
                      >
                        <Square size={12} />
                        終了
                      </button>
                    )}
                    <button
                      onClick={() => deleteLog(log.id)}
                      className="p-1 rounded hover:bg-coc-raised text-red-400 transition-colors"
                      aria-label="削除"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {logs.filter((l) => l.ended_at).length > 0 && (
            <div className="mt-4 pt-3 border-t border-coc-border flex justify-end">
              <p className="text-xs text-coc-muted">
                完了シーン合計時間:{" "}
                <span className="font-medium text-coc-text">
                  {Math.floor(totalMinutes / 60) > 0
                    ? `${Math.floor(totalMinutes / 60)}時間${totalMinutes % 60}分`
                    : `${totalMinutes}分`}
                </span>
              </p>
            </div>
          )}
        </div>
      )}

      {logs.length === 0 && (
        <p className="text-center text-sm text-coc-muted py-8">
          まだシーンが記録されていません
        </p>
      )}

      <div className={`rounded-xl border px-5 py-4 space-y-3 ${activeLog ? "border-coc-border bg-coc-surface opacity-60 pointer-events-none" : "border-coc-gold-dim bg-coc-raised"}`}>
        <p className="text-xs font-medium text-coc-gold">
          {activeLog ? `「${activeLog.scene_label}」が進行中です` : "新しいシーンを開始"}
        </p>
        {!activeLog && (
          <>
            <input
              type="text"
              placeholder="シーン名（例: 図書館調査、クライマックス）"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") startScene();
              }}
              className="w-full rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text placeholder-coc-muted focus:border-coc-gold focus:outline-none"
            />
            <button
              onClick={startScene}
              disabled={!newLabel.trim() || saving}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-coc-gold py-2 text-sm font-medium text-black disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              <Play size={14} />
              {saving ? "記録中..." : "シーン開始"}
            </button>
          </>
        )}
        {activeLog && (
          <button
            onClick={() => endScene(activeLog.id)}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-coc-gold py-2 text-sm font-medium text-coc-gold hover:bg-coc-gold/10 transition-colors pointer-events-auto"
          >
            <Square size={14} />
            シーン終了
          </button>
        )}
      </div>

      {!activeLog && (
        <div className="flex items-center justify-center">
          <button
            onClick={() => setNewLabel("")}
            className="flex items-center gap-1.5 text-xs text-coc-muted hover:text-coc-text transition-colors"
          >
            <Plus size={14} />
            シーンを追加するにはシーン名を入力してください
          </button>
        </div>
      )}
    </div>
  );
}
