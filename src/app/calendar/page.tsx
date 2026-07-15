"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { supabase, isSupabaseConfigured, Scenario } from "@/lib/supabase";
import { useAuth } from "@/app/_components/AuthProvider";

const WEEKDAYS = ["月", "火", "水", "木", "金", "土", "日"];

const STATUS_COLORS: Record<string, string> = {
  planning: "bg-coc-surface text-coc-muted border border-coc-border",
  ongoing: "bg-coc-gold/10 text-coc-gold border border-coc-gold/30",
  completed: "bg-green-900/20 text-green-400 border border-green-800",
};

type ScenarioWithCampaign = Scenario & { campaign_name?: string | null };

export default function CalendarPage() {
  const { user, loading: authLoading } = useAuth();
  const [scenarios, setScenarios] = useState<ScenarioWithCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed

  useEffect(() => {
    if (authLoading) return;
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);

      let scenarioIds: string[] = [];

      if (user) {
        // Get user's character IDs (RLS filters to the current user automatically)
        const { data: characters } = await supabase
          .from("characters")
          .select("id");

        const characterIds = ((characters ?? []) as { id: string }[]).map((c) => c.id);

        if (characterIds.length > 0) {
          const { data: participants } = await supabase
            .from("scenario_participants")
            .select("scenario_id")
            .in("character_id", characterIds);

          scenarioIds = [
            ...new Set(
              ((participants ?? []) as { scenario_id: string }[]).map((p) => p.scenario_id)
            ),
          ];
        }
      }

      if (scenarioIds.length === 0) {
        setScenarios([]);
        setLoading(false);
        return;
      }

      const [{ data: scenariosData }, { data: campaignScenariosData }] = await Promise.all([
        supabase
          .from("scenarios")
          .select("id, title, status, next_session_at")
          .in("id", scenarioIds)
          .not("next_session_at", "is", null),
        supabase
          .from("campaign_scenarios")
          .select("scenario_id, campaigns(title)")
          .in("scenario_id", scenarioIds),
      ]);

      type CampaignScenarioRow = { scenario_id: string; campaigns: { title: string } | null };
      const campaignNameByScenario: Record<string, string> = {};
      for (const cs of (campaignScenariosData as unknown as CampaignScenarioRow[]) ?? []) {
        if (cs.campaigns) campaignNameByScenario[cs.scenario_id] = cs.campaigns.title;
      }

      setScenarios(
        ((scenariosData as Scenario[]) ?? []).map((s) => ({
          ...s,
          campaign_name: campaignNameByScenario[s.id] ?? null,
        }))
      );
      setLoading(false);
    }

    load();
  }, [user, authLoading]);

  function prevMonth() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  }

  function nextMonth() {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  }

  // Monday-first: getDay() returns 0=Sun … 6=Sat; (d+6)%7 gives 0=Mon … 6=Sun
  const rawFirstDay = new Date(year, month, 1).getDay();
  const firstDayOfWeek = (rawFirstDay + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((firstDayOfWeek + daysInMonth) / 7) * 7;
  const cells = Array.from({ length: totalCells }, (_, i) => {
    const day = i - firstDayOfWeek + 1;
    return day >= 1 && day <= daysInMonth ? day : null;
  });

  const scenariosByDay: Record<number, ScenarioWithCampaign[]> = {};
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
        <div>
          <h1 className="text-2xl font-bold text-coc-text font-cinzel">📅 セッションカレンダー</h1>
          <p className="text-xs text-coc-muted mt-1">参加予定・参加済みのセッションを月別表示</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/api/calendar/ical"
            download="trpg-sessions.ics"
            className="flex items-center gap-1.5 rounded-lg border border-coc-border px-3 py-1.5 text-sm text-coc-muted hover:text-coc-text hover:border-coc-gold transition-colors"
          >
            <Download size={14} />
            .ics
          </a>
          <button
            onClick={prevMonth}
            className="p-2 rounded-lg border border-coc-border text-coc-muted hover:text-coc-text hover:border-coc-gold transition-colors"
            aria-label="前月"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth()); }}
            className="px-3 py-1.5 rounded-lg border border-coc-border text-sm text-coc-muted hover:text-coc-text hover:border-coc-gold transition-colors"
          >
            今月
          </button>
          <span className="text-coc-text font-semibold min-w-[6rem] text-center">
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

      {!user && !authLoading ? (
        <div className="rounded-lg border border-coc-border bg-coc-surface/30 py-16 text-center">
          <p className="text-coc-muted text-sm mb-3">参加セッションを表示するにはログインが必要です。</p>
          <Link
            href="/login"
            className="inline-block rounded-lg border border-coc-gold/50 px-4 py-2 text-sm text-coc-gold hover:bg-coc-gold/10 transition-colors"
          >
            ログイン
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((w, i) => (
              <div
                key={w}
                className={`py-2 text-center text-xs font-semibold ${
                  i === 5 ? "text-blue-400" : i === 6 ? "text-red-400" : "text-coc-muted"
                }`}
              >
                {w}
              </div>
            ))}
          </div>

          {loading || authLoading ? (
            <div className="text-coc-muted text-center py-16">読み込み中...</div>
          ) : (
            <>
              <div className="grid grid-cols-7 border-l border-t border-coc-border rounded-lg overflow-hidden">
                {cells.map((day, idx) => {
                  const col = idx % 7;
                  const dayScenarios = day ? (scenariosByDay[day] ?? []) : [];
                  const isToday = isCurrentMonth && day === todayDay;
                  const isSat = col === 5;
                  const isSun = col === 6;

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
                          title={s.campaign_name ? `[${s.campaign_name}] ${s.title}` : s.title}
                        >
                          {s.campaign_name && (
                            <span className="opacity-60 mr-0.5">[{s.campaign_name}]</span>
                          )}
                          {s.title}
                        </Link>
                      ))}
                    </div>
                  );
                })}
              </div>

              {scenarios.length === 0 && (
                <div className="mt-6 rounded-lg border border-coc-border bg-coc-surface/20 py-10 text-center text-coc-muted text-sm">
                  参加予定のセッションがありません。
                </div>
              )}
            </>
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
        </>
      )}
    </div>
  );
}
