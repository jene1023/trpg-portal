"use client";

import { useState } from "react";
import { Plus, Trash2, Shuffle } from "lucide-react";
import { supabase, isSupabaseConfigured, ScenarioRandomEvent } from "@/lib/supabase";

type Props = {
  scenarioId: string;
  initialEvents: ScenarioRandomEvent[];
};

export default function RandomEventList({ scenarioId, initialEvents }: Props) {
  const [events, setEvents] = useState<ScenarioRandomEvent[]>(initialEvents);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [weight, setWeight] = useState(1);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [drawnEvent, setDrawnEvent] = useState<ScenarioRandomEvent | null>(null);

  async function addEvent() {
    if (!title.trim() || !isSupabaseConfigured) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("scenario_random_events")
      .insert({
        scenario_id: scenarioId,
        title: title.trim(),
        description: description.trim() || null,
        weight: weight,
      })
      .select()
      .single();
    if (!error && data) {
      setEvents((prev) => [...prev, data as ScenarioRandomEvent]);
      setTitle("");
      setDescription("");
      setWeight(1);
      setAdding(false);
    }
    setSaving(false);
  }

  async function deleteEvent(id: string) {
    if (!isSupabaseConfigured) return;
    await supabase.from("scenario_random_events").delete().eq("id", id);
    setEvents((prev) => prev.filter((e) => e.id !== id));
    if (drawnEvent?.id === id) setDrawnEvent(null);
  }

  function drawEvent() {
    if (events.length === 0) return;
    const totalWeight = events.reduce((sum, e) => sum + e.weight, 0);
    let rand = Math.random() * totalWeight;
    for (const e of events) {
      rand -= e.weight;
      if (rand <= 0) {
        setDrawnEvent(e);
        return;
      }
    }
    setDrawnEvent(events[events.length - 1]);
  }

  return (
    <div className="space-y-4">
      <button
        onClick={drawEvent}
        disabled={events.length === 0}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-coc-gold bg-coc-gold/10 py-3 text-sm font-semibold text-coc-gold hover:bg-coc-gold/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Shuffle size={18} />
        抽選する
      </button>

      {drawnEvent && (
        <div className="rounded-xl border border-coc-gold bg-coc-raised px-5 py-4 animate-pulse-once">
          <p className="text-xs font-medium text-coc-gold mb-1">抽選結果</p>
          <p className="font-semibold text-coc-text text-lg">{drawnEvent.title}</p>
          {drawnEvent.description && (
            <p className="text-sm text-coc-muted mt-2 whitespace-pre-wrap">{drawnEvent.description}</p>
          )}
          <p className="text-xs text-coc-muted mt-2">重み: {drawnEvent.weight}</p>
        </div>
      )}

      <div className="space-y-3">
        {events.map((evt) => (
          <div
            key={evt.id}
            className={`rounded-xl border bg-coc-surface px-5 py-4 transition-colors ${
              drawnEvent?.id === evt.id ? "border-coc-gold" : "border-coc-border"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="rounded-full bg-coc-gold/20 px-2 py-0.5 text-xs font-medium text-coc-gold">
                    重み {evt.weight}
                  </span>
                  <h3 className="font-medium text-coc-text">{evt.title}</h3>
                </div>
                {evt.description && (
                  <p className="text-sm text-coc-muted whitespace-pre-wrap">{evt.description}</p>
                )}
              </div>
              <button
                onClick={() => deleteEvent(evt.id)}
                className="shrink-0 p-1 rounded hover:bg-coc-raised text-red-400 transition-colors"
                aria-label="削除"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {events.length === 0 && !adding && (
        <p className="text-center text-sm text-coc-muted py-8">ランダムイベントがまだ登録されていません</p>
      )}

      {adding ? (
        <div className="rounded-xl border border-coc-gold-dim bg-coc-raised px-5 py-4 space-y-3">
          <input
            type="text"
            placeholder="イベントタイトル（例: 奇妙な物音、謎の人物が現れる）"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text placeholder-coc-muted focus:border-coc-gold focus:outline-none"
            autoFocus
          />
          <textarea
            placeholder="詳細説明（任意）"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text placeholder-coc-muted focus:border-coc-gold focus:outline-none resize-none"
          />
          <div className="flex items-center gap-3">
            <label className="text-sm text-coc-muted shrink-0">重み</label>
            <input
              type="number"
              min={1}
              max={100}
              value={weight}
              onChange={(e) => setWeight(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-20 rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text focus:border-coc-gold focus:outline-none"
            />
            <span className="text-xs text-coc-muted">（大きいほど選ばれやすい）</span>
          </div>
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
                setDescription("");
                setWeight(1);
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
          イベントを追加
        </button>
      )}
    </div>
  );
}
