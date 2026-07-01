"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase, isSupabaseConfigured, Scenario } from "@/lib/supabase";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

const STATUS_COLORS: Record<string, string> = {
  planning: "bg-coc-surface text-coc-muted border border-coc-border",
  ongoing: "bg-coc-gold/10 text-coc-gold border border-coc-gold/30",
  completed: "bg-green-900/20 text-green-400 border border-green-800",
};

export default function CalendarPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    supabase
      .from("scenarios")
      .select("id, title, status, next_session_at")
      .not("next_session_at", "is", null)
      .then(({ data }) => {
        setScenarios((data as Scenario[]) ?? []);
        setLoading(false);
      });
  }, []);

  function prevMonth() {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else {
      setMonth((m) => m + 1);
    }
  }

  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((firstDayOfWeek + daysInMonth) / 7) * 7;
  const cells = Array.from({ length: totalCells }, (_, i) => {
    const day = i - firstDayOfWeek + 1;
    return day >= 1 && day <= daysInMonth ? day : null;
  });

  const scenariosByDay: Record<number, Scenario[]> = {};
  for (const s of scenarios) {
    if (!s.next_session_at) continue;
    const d = new Date(s.next_session_at);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!scenariosByDay[day]) scenariosByDay[day] = [];
      scenariosByDay[day].push(s);
    }
  }

  const todayDay = now.getDate();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() === month;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-coc-text font-cinzel">セッションカレンダー</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={prevMonth}
            className="p-2 rounded-lg border border-coc-border text-coc-muted hover:text-coc-text hover:border-coc-gold transition-colors"
            aria-label="前月"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-coc-text font-semibold min-w-[8rem] text-center">
            {year}年{month + 1}月
          </span>
          <button
            onClick={nextMonth}
            className="p-2 rounded-lg border border-coc-border text-coc-muted hover:text-coc-text hover:border-coc-gold transition-colors"
            aria-label="翌月"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className={`py-2 text-center text-xs font-semibold ${
              i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-coc-muted"
            }`}
          >
            {w}
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-coc-muted text-center py-16">読み込み中...</div>
      ) : (
        <div className="grid grid-cols-7 border-l border-t border-coc-border rounded-lg overflow-hidden">
          {cells.map((day, idx) => {
            const col = idx % 7;
            const dayScenarios = day ? (scenariosByDay[day] ?? []) : [];
            const isToday = isCurrentMonth && day === todayDay;
            const isSun = col === 0;
            const isSat = col === 6;

            return (
              <div
                key={idx}
                className={`min-h-[84px] p-1 border-r border-b border-coc-border flex flex-col gap-1 ${
                  day
                    ? isSun || isSat
                      ? "bg-coc-void/40"
                      : "bg-coc-void"
                    : "bg-coc-surface/20"
                }`}
              >
                {day !== null && (
                  <span
                    className={`text-xs font-medium self-end w-6 h-6 flex items-center justify-center rounded-full leading-none ${
                      isToday
                        ? "bg-coc-gold text-coc-void font-bold"
                        : isSun
                        ? "text-red-400"
                        : isSat
                        ? "text-blue-400"
                        : "text-coc-muted"
                    }`}
                  >
                    {day}
                  </span>
                )}
                {dayScenarios.map((s) => (
                  <Link
                    key={s.id}
                    href={`/scenarios/${s.id}`}
                    className={`block text-xs px-1 py-0.5 rounded truncate transition-opacity hover:opacity-70 ${
                      STATUS_COLORS[s.status] ?? STATUS_COLORS.planning
                    }`}
                    title={s.title}
                  >
                    {s.title}
                  </Link>
                ))}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-coc-muted">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded border border-coc-border bg-coc-surface" />
          準備中
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-coc-gold/10 border border-coc-gold/30" />
          進行中
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-green-900/20 border border-green-800" />
          完了
        </span>
      </div>
    </div>
  );
}
