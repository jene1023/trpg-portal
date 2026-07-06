"use client";

import { useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Clock, ChevronDown, ChevronUp } from "lucide-react";

type Props = {
  scenarioId: string;
  initialDate: string | null;
  initialTime: string | null;
};

export default function GameClockEditor({ scenarioId, initialDate, initialTime }: Props) {
  const [date, setDate] = useState(initialDate ?? "");
  const [time, setTime] = useState(initialTime ?? "");
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [currentTime, setCurrentTime] = useState(initialTime);

  const displayText = [currentDate, currentTime].filter(Boolean).join(" ");

  async function save() {
    if (!isSupabaseConfigured) return;
    setSaving(true);
    const { error } = await supabase
      .from("scenarios")
      .update({
        game_current_date: date || null,
        game_current_time: time || null,
      })
      .eq("id", scenarioId);
    if (!error) {
      setCurrentDate(date || null);
      setCurrentTime(time || null);
      setExpanded(false);
    }
    setSaving(false);
  }

  return (
    <div>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-full border border-coc-border bg-coc-surface px-3 py-1 text-xs hover:border-coc-gold hover:text-coc-gold transition-colors text-coc-muted"
      >
        <Clock size={12} />
        {displayText || "ゲーム内時刻を設定"}
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {expanded && (
        <div className="mt-2 flex flex-wrap items-end gap-3 rounded-xl border border-coc-border bg-coc-surface px-4 py-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-coc-muted">ゲーム内日付</label>
            <input
              type="text"
              placeholder="例: 1923-10-13"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-lg border border-coc-border bg-coc-bg px-3 py-1.5 text-sm text-coc-text focus:outline-none focus:border-coc-gold w-40"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-coc-muted">ゲーム内時刻</label>
            <input
              type="text"
              placeholder="例: 15:00"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="rounded-lg border border-coc-border bg-coc-bg px-3 py-1.5 text-sm text-coc-text focus:outline-none focus:border-coc-gold w-28"
            />
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-lg border border-coc-gold bg-coc-gold/10 px-3 py-1.5 text-sm font-medium text-coc-gold hover:bg-coc-gold/20 transition-colors disabled:opacity-50"
          >
            {saving ? "更新中…" : "更新"}
          </button>
          <button
            onClick={() => setExpanded(false)}
            className="py-1.5 text-xs text-coc-muted hover:text-coc-text transition-colors"
          >
            キャンセル
          </button>
        </div>
      )}
    </div>
  );
}
