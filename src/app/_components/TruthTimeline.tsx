"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, Trash2, Plus, Eye, EyeOff } from "lucide-react";
import { supabase, isSupabaseConfigured, ScenarioTimelineEvent } from "@/lib/supabase";

type Props = {
  scenarioId: string;
  initialEvents: ScenarioTimelineEvent[];
};

export default function TruthTimeline({ scenarioId, initialEvents }: Props) {
  const [events, setEvents] = useState<ScenarioTimelineEvent[]>(initialEvents);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [description, setDescription] = useState("");

  async function addEvent() {
    if (!title.trim() || !isSupabaseConfigured) return;
    setSaving(true);
    const maxOrder = events.length > 0 ? Math.max(...events.map((e) => e.event_order)) : -1;
    const { data, error } = await supabase
      .from("scenario_timeline_events")
      .insert({
        scenario_id: scenarioId,
        title: title.trim(),
        event_date: eventDate.trim() || null,
        description: description.trim() || null,
        event_order: maxOrder + 1,
        is_revealed: false,
      })
      .select()
      .single();
    if (!error && data) {
      setEvents((prev) => [...prev, data as ScenarioTimelineEvent]);
      setTitle("");
      setEventDate("");
      setDescription("");
      setAdding(false);
    }
    setSaving(false);
  }

  async function deleteEvent(id: string) {
    if (!isSupabaseConfigured) return;
    await supabase.from("scenario_timeline_events").delete().eq("id", id);
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

  async function toggleRevealed(id: string, current: boolean) {
    if (!isSupabaseConfigured) return;
    await supabase
      .from("scenario_timeline_events")
      .update({ is_revealed: !current })
      .eq("id", id);
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, is_revealed: !current } : e))
    );
  }

  async function moveEvent(index: number, direction: -1 | 1) {
    if (!isSupabaseConfigured) return;
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= events.length) return;
    const updated = [...events];
    const aOrder = updated[index].event_order;
    const bOrder = updated[swapIndex].event_order;
    await Promise.all([
      supabase.from("scenario_timeline_events").update({ event_order: bOrder }).eq("id", updated[index].id),
      supabase.from("scenario_timeline_events").update({ event_order: aOrder }).eq("id", updated[swapIndex].id),
    ]);
    updated[index] = { ...updated[index], event_order: bOrder };
    updated[swapIndex] = { ...updated[swapIndex], event_order: aOrder };
    updated.sort((a, b) => a.event_order - b.event_order);
    setEvents(updated);
  }

  return (
    <div className="space-y-0">
      {events.length === 0 && !adding && (
        <p className="text-center text-sm text-coc-muted py-8">
          真相タイムラインがまだ登録されていません
        </p>
      )}

      <div className="relative pl-6">
        {events.length > 0 && (
          <div className="absolute left-[7px] top-0 bottom-0 w-0.5 bg-coc-border" />
        )}
        <div className="space-y-4">
          {events.map((event, i) => (
            <div key={event.id} className="relative">
              <div
                className={`absolute left-[-25px] top-3.5 h-3 w-3 rounded-full border-2 ${
                  event.is_revealed
                    ? "border-coc-gold bg-coc-gold"
                    : "border-coc-border bg-coc-bg"
                }`}
              />
              <div
                className={`rounded-xl border bg-coc-surface overflow-hidden transition-colors ${
                  event.is_revealed ? "border-coc-gold-dim" : "border-coc-border"
                }`}
              >
                <div className="flex items-start justify-between px-4 py-3 gap-3">
                  <div className="flex-1 min-w-0">
                    {event.event_date && (
                      <p className="text-xs text-coc-muted mb-0.5">{event.event_date}</p>
                    )}
                    <h3 className="font-medium text-coc-text">{event.title}</h3>
                    {event.description && (
                      <p className="mt-1 text-sm text-coc-muted whitespace-pre-wrap">
                        {event.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => toggleRevealed(event.id, event.is_revealed)}
                      className={`p-1 rounded transition-colors ${
                        event.is_revealed
                          ? "text-coc-gold hover:opacity-70"
                          : "text-coc-muted hover:text-coc-gold"
                      }`}
                      title={event.is_revealed ? "PLに明かされた真相" : "未開示"}
                    >
                      {event.is_revealed ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                    <button
                      onClick={() => moveEvent(i, -1)}
                      disabled={i === 0}
                      className="p-1 rounded hover:bg-coc-raised text-coc-muted disabled:opacity-30 transition-colors"
                      aria-label="上へ"
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      onClick={() => moveEvent(i, 1)}
                      disabled={i === events.length - 1}
                      className="p-1 rounded hover:bg-coc-raised text-coc-muted disabled:opacity-30 transition-colors"
                      aria-label="下へ"
                    >
                      <ChevronDown size={16} />
                    </button>
                    <button
                      onClick={() => deleteEvent(event.id)}
                      className="p-1 rounded hover:bg-coc-raised text-red-400 transition-colors"
                      aria-label="削除"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                {event.is_revealed && (
                  <div className="px-4 pb-2">
                    <span className="inline-flex items-center gap-1 text-xs text-coc-gold">
                      <Eye size={11} />
                      PLに明かされた真相
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4">
        {adding ? (
          <div className="rounded-xl border border-coc-gold-dim bg-coc-raised px-5 py-4 space-y-3">
            <input
              type="text"
              placeholder="出来事タイトル（例: 老教授の失踪）"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text placeholder-coc-muted focus:border-coc-gold focus:outline-none"
              autoFocus
            />
            <input
              type="text"
              placeholder="日付（例: 1920年3月15日、任意書式）"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text placeholder-coc-muted focus:border-coc-gold focus:outline-none"
            />
            <textarea
              placeholder="詳細説明（任意）"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text placeholder-coc-muted focus:border-coc-gold focus:outline-none resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={addEvent}
                disabled={!title.trim() || saving}
                className="flex-1 rounded-lg bg-coc-gold py-2 text-sm font-medium text-black disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                {saving ? "保存中..." : "追加"}
              </button>
              <button
                onClick={() => {
                  setAdding(false);
                  setTitle("");
                  setEventDate("");
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
            出来事を追加
          </button>
        )}
      </div>
    </div>
  );
}
