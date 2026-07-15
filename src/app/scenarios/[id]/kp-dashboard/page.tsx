"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Users, GitBranch, ClipboardList, RefreshCw } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type HandoutRow = {
  id: string;
  title: string;
  is_distributed: boolean;
  recipient_name: string | null;
  handout_reads: { character_id: string }[];
};

type ParticipantRow = {
  character_id: string;
  attendance_status: string;
  characters: { name: string } | null;
};

type PlotThreadRow = {
  title: string;
  status: string;
};

type PrepTaskRow = {
  task_name: string;
  is_done: boolean;
};

type Props = { params: Promise<{ id: string }> };

export default function KpDashboardPage({ params }: Props) {
  const [scenarioId, setScenarioId] = useState("");
  const [scenarioTitle, setScenarioTitle] = useState("");
  const [handouts, setHandouts] = useState<HandoutRow[]>([]);
  const [participants, setParticipants] = useState<ParticipantRow[]>([]);
  const [plotThreads, setPlotThreads] = useState<PlotThreadRow[]>([]);
  const [prepTasks, setPrepTasks] = useState<PrepTaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  async function fetchData(id: string) {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    const [handoutsRes, participantsRes, plotsRes, tasksRes, scenarioRes] = await Promise.all([
      supabase
        .from("handouts")
        .select("id, title, is_distributed, recipient_name, handout_reads(character_id)")
        .eq("scenario_id", id),
      supabase
        .from("scenario_participants")
        .select("character_id, attendance_status, characters(name)")
        .eq("scenario_id", id),
      supabase
        .from("plot_threads")
        .select("title, status")
        .eq("scenario_id", id),
      supabase
        .from("scenario_prep_tasks")
        .select("task_name, is_done")
        .eq("scenario_id", id),
      supabase
        .from("scenarios")
        .select("title")
        .eq("id", id)
        .single(),
    ]);

    if (scenarioRes.data) setScenarioTitle(scenarioRes.data.title);
    setHandouts((handoutsRes.data ?? []) as HandoutRow[]);
    setParticipants((participantsRes.data ?? []) as ParticipantRow[]);
    setPlotThreads((plotsRes.data ?? []) as PlotThreadRow[]);
    setPrepTasks((tasksRes.data ?? []) as PrepTaskRow[]);
    setLastUpdated(new Date());
    setLoading(false);
  }

  useEffect(() => {
    params.then(({ id }) => {
      setScenarioId(id);
      fetchData(id);

      if (!isSupabaseConfigured) return;
      const channel = supabase
        .channel(`kp-dashboard-${id}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "handouts", filter: `scenario_id=eq.${id}` }, () => {
          fetchData(id);
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "scenario_participants", filter: `scenario_id=eq.${id}` }, () => {
          fetchData(id);
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "plot_threads", filter: `scenario_id=eq.${id}` }, () => {
          fetchData(id);
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "scenario_prep_tasks", filter: `scenario_id=eq.${id}` }, () => {
          fetchData(id);
        })
        .subscribe();
      channelRef.current = channel;
    });

    return () => {
      if (channelRef.current && isSupabaseConfigured) {
        supabase.removeChannel(channelRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const distributedCount = handouts.filter((h) => h.is_distributed).length;
  const undistributedCount = handouts.filter((h) => !h.is_distributed).length;

  const attendingCount = participants.filter((p) => p.attendance_status === "attending").length;
  const unconfirmedCount = participants.filter((p) => p.attendance_status === "unconfirmed").length;

  const unresolvedPlotCount = plotThreads.filter((p) => p.status === "pending").length;
  const totalPlotCount = plotThreads.length;

  const pendingTaskCount = prepTasks.filter((t) => !t.is_done).length;
  const totalTaskCount = prepTasks.length;

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-coc-muted text-sm">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="coc-page-enter mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between gap-3 mb-6">
        <Link
          href={`/scenarios/${scenarioId}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          {scenarioTitle || "シナリオ詳細"}
        </Link>
        <button
          onClick={() => fetchData(scenarioId)}
          className="flex items-center gap-1.5 text-xs text-coc-muted hover:text-coc-gold transition-colors"
        >
          <RefreshCw size={14} />
          更新
        </button>
      </div>

      <div className="mb-6">
        <h1 className="font-cinzel text-xl font-bold text-coc-text mb-1">🎛 KPダッシュボード</h1>
        <p className="text-xs text-coc-muted">
          {scenarioTitle}
          {lastUpdated && (
            <span className="ml-2">
              — 最終更新: {lastUpdated.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        {/* ハンドアウトカード */}
        <Link
          href={`/scenarios/${scenarioId}/handouts`}
          className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-2 mb-3">
            <FileText size={18} className="text-coc-gold" />
            <p className="font-medium text-coc-text text-sm">ハンドアウト</p>
          </div>
          <div className="flex items-end gap-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{distributedCount}</p>
              <p className="text-xs text-coc-muted">配布済</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-400">{undistributedCount}</p>
              <p className="text-xs text-coc-muted">未配布</p>
            </div>
          </div>
          {undistributedCount > 0 && (
            <div className="mt-3 space-y-1">
              {handouts
                .filter((h) => !h.is_distributed)
                .slice(0, 3)
                .map((h) => (
                  <p key={h.id} className="text-xs text-yellow-400 truncate">
                    • {h.title}{h.recipient_name ? ` (${h.recipient_name})` : ""}
                  </p>
                ))}
              {undistributedCount > 3 && (
                <p className="text-xs text-coc-muted">他 {undistributedCount - 3} 件...</p>
              )}
            </div>
          )}
        </Link>

        {/* 出席確認カード */}
        <Link
          href={`/scenarios/${scenarioId}/participants`}
          className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-2 mb-3">
            <Users size={18} className="text-coc-gold" />
            <p className="font-medium text-coc-text text-sm">出席確認</p>
          </div>
          <div className="flex items-end gap-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{attendingCount}</p>
              <p className="text-xs text-coc-muted">出席確定</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-400">{unconfirmedCount}</p>
              <p className="text-xs text-coc-muted">未確認</p>
            </div>
          </div>
          {unconfirmedCount > 0 && (
            <div className="mt-3 space-y-1">
              {participants
                .filter((p) => p.attendance_status === "unconfirmed")
                .slice(0, 3)
                .map((p, i) => (
                  <p key={i} className="text-xs text-yellow-400 truncate">
                    • {p.characters?.name ?? "不明"}
                  </p>
                ))}
            </div>
          )}
        </Link>

        {/* 未解決プロットカード */}
        <Link
          href={`/scenarios/${scenarioId}/plot-threads`}
          className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-2 mb-3">
            <GitBranch size={18} className="text-coc-gold" />
            <p className="font-medium text-coc-text text-sm">謎・伏線</p>
          </div>
          <div className="flex items-end gap-3">
            <div className="text-center">
              <p className={`text-2xl font-bold ${unresolvedPlotCount > 0 ? "text-red-400" : "text-green-400"}`}>
                {unresolvedPlotCount}
              </p>
              <p className="text-xs text-coc-muted">未解決</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-coc-muted">{totalPlotCount}</p>
              <p className="text-xs text-coc-muted">合計</p>
            </div>
          </div>
          {unresolvedPlotCount > 0 && (
            <div className="mt-3 space-y-1">
              {plotThreads
                .filter((p) => p.status === "pending")
                .slice(0, 3)
                .map((p, i) => (
                  <p key={i} className="text-xs text-red-400 truncate">
                    • {p.title}
                  </p>
                ))}
              {unresolvedPlotCount > 3 && (
                <p className="text-xs text-coc-muted">他 {unresolvedPlotCount - 3} 件...</p>
              )}
            </div>
          )}
        </Link>

        {/* 準備タスクカード */}
        <Link
          href={`/scenarios/${scenarioId}/prep`}
          className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-2 mb-3">
            <ClipboardList size={18} className="text-coc-gold" />
            <p className="font-medium text-coc-text text-sm">準備タスク</p>
          </div>
          <div className="flex items-end gap-3">
            <div className="text-center">
              <p className={`text-2xl font-bold ${pendingTaskCount > 0 ? "text-yellow-400" : "text-green-400"}`}>
                {pendingTaskCount}
              </p>
              <p className="text-xs text-coc-muted">未完了</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-coc-muted">{totalTaskCount}</p>
              <p className="text-xs text-coc-muted">合計</p>
            </div>
          </div>
          {pendingTaskCount > 0 && (
            <div className="mt-3 space-y-1">
              {prepTasks
                .filter((t) => !t.is_done)
                .slice(0, 3)
                .map((t, i) => (
                  <p key={i} className="text-xs text-yellow-400 truncate">
                    • {t.task_name}
                  </p>
                ))}
              {pendingTaskCount > 3 && (
                <p className="text-xs text-coc-muted">他 {pendingTaskCount - 3} 件...</p>
              )}
            </div>
          )}
        </Link>
      </div>

      {/* 配布済みハンドアウト詳細 */}
      {handouts.length > 0 && (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4 mb-4">
          <p className="font-cinzel text-xs font-medium text-coc-muted uppercase tracking-widest mb-3">
            ハンドアウト一覧
          </p>
          <div className="space-y-2">
            {handouts.map((h) => (
              <div key={h.id} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    h.is_distributed
                      ? "bg-green-900/40 text-green-400"
                      : "bg-yellow-900/40 text-yellow-400"
                  }`}>
                    {h.is_distributed ? "配布済" : "未配布"}
                  </span>
                  <span className="text-sm text-coc-text truncate">{h.title}</span>
                </div>
                {h.recipient_name && (
                  <span className="text-xs text-coc-muted shrink-0">{h.recipient_name}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 参加者出席状況詳細 */}
      {participants.length > 0 && (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4 mb-4">
          <p className="font-cinzel text-xs font-medium text-coc-muted uppercase tracking-widest mb-3">
            参加者出席状況
          </p>
          <div className="space-y-2">
            {participants.map((p, i) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <span className="text-sm text-coc-text">{p.characters?.name ?? "不明"}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  p.attendance_status === "attending"
                    ? "bg-green-900/40 text-green-400"
                    : p.attendance_status === "absent"
                    ? "bg-red-900/40 text-red-400"
                    : "bg-yellow-900/40 text-yellow-400"
                }`}>
                  {p.attendance_status === "attending"
                    ? "出席"
                    : p.attendance_status === "absent"
                    ? "欠席"
                    : "未確認"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
