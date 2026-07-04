"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Target, CheckCircle2, XCircle, Clock } from "lucide-react";
import { supabase, isSupabaseConfigured, SessionGoal, SessionGoalStatus } from "@/lib/supabase";

type Tab = "pending" | "achieved" | "failed";

const TAB_LABELS: Record<Tab, string> = {
  pending: "進行中",
  achieved: "達成",
  failed: "未達",
};

const STATUS_ICON: Record<SessionGoalStatus, React.ReactNode> = {
  pending: <Clock size={14} className="text-coc-muted" />,
  achieved: <CheckCircle2 size={14} className="text-green-400" />,
  failed: <XCircle size={14} className="text-red-400" />,
};

export default function SessionGoalsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [goals, setGoals] = useState<SessionGoal[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [goalText, setGoalText] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchGoals = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    const { data } = await supabase
      .from("session_goals")
      .select("*")
      .eq("character_id", id)
      .order("created_at", { ascending: false });
    setGoals(data ?? []);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  async function addGoal() {
    if (!isSupabaseConfigured || !goalText.trim()) return;
    setSaving(true);
    await supabase.from("session_goals").insert({
      character_id: id,
      goal: goalText.trim(),
      status: "pending",
      set_at: new Date().toISOString(),
    });
    setGoalText("");
    await fetchGoals();
    setSaving(false);
  }

  async function updateStatus(goalId: string, status: SessionGoalStatus) {
    if (!isSupabaseConfigured) return;
    await supabase
      .from("session_goals")
      .update({ status, resolved_at: status !== "pending" ? new Date().toISOString() : null })
      .eq("id", goalId);
    await fetchGoals();
  }

  async function deleteGoal(goalId: string) {
    if (!isSupabaseConfigured) return;
    await supabase.from("session_goals").delete().eq("id", goalId);
    await fetchGoals();
  }

  const filtered = goals.filter((g) => g.status === activeTab);
  const pendingCount = goals.filter((g) => g.status === "pending").length;

  const cardBg: Record<Tab, string> = {
    pending: "border-coc-border bg-coc-surface",
    achieved: "border-green-800 bg-green-950/20",
    failed: "border-red-800 bg-red-950/20",
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/characters/${id}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          キャラクター詳細
        </Link>
      </div>

      <div className="flex items-center gap-2 mb-1">
        <Target size={20} className="text-coc-gold" />
        <h1 className="font-cinzel text-xl font-bold text-coc-text">セッション目標</h1>
      </div>
      <p className="text-sm text-coc-muted mb-6">
        次回セッションに向けた個人チャレンジ目標を設定し、達成・未達を記録できます。
      </p>

      {/* 目標追加フォーム */}
      <div className="rounded-lg border border-coc-border bg-coc-surface p-4 mb-6 space-y-3">
        <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest">目標を追加</h2>
        <textarea
          value={goalText}
          onChange={(e) => setGoalText(e.target.value)}
          placeholder="例: この技能で成功する、このNPCと会話する、呪文を1回使う..."
          rows={2}
          className="w-full rounded-md border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:border-coc-gold focus:outline-none resize-none"
        />
        <button
          onClick={addGoal}
          disabled={saving || !goalText.trim()}
          className="rounded-md bg-coc-gold/90 hover:bg-coc-gold px-4 py-2 text-sm font-semibold text-coc-void disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? "追加中..." : "目標を追加"}
        </button>
      </div>

      {/* タブ */}
      <div className="flex gap-1 rounded-lg border border-coc-border bg-coc-raised p-1 mb-4">
        {(["pending", "achieved", "failed"] as Tab[]).map((tab) => {
          const count = goals.filter((g) => g.status === tab).length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "bg-coc-surface text-coc-text shadow-sm"
                  : "text-coc-muted hover:text-coc-text"
              }`}
            >
              {STATUS_ICON[tab]}
              {TAB_LABELS[tab]}
              {count > 0 && (
                <span className="rounded-full bg-coc-raised border border-coc-border px-1.5 text-xs">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 目標一覧 */}
      {loading ? (
        <p className="text-sm text-coc-muted text-center py-8">読み込み中...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-coc-muted text-center py-8">
          {activeTab === "pending" ? "進行中の目標はありません" : activeTab === "achieved" ? "達成した目標はありません" : "未達の目標はありません"}
        </p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((goal) => (
            <li
              key={goal.id}
              className={`rounded-lg border p-4 ${cardBg[activeTab]}`}
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex-shrink-0">{STATUS_ICON[goal.status]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-coc-text leading-relaxed whitespace-pre-wrap break-words">
                    {goal.goal}
                  </p>
                  {goal.set_at && (
                    <p className="text-xs text-coc-muted mt-1">
                      設定日: {new Date(goal.set_at).toLocaleDateString("ja-JP")}
                    </p>
                  )}
                  {goal.resolved_at && (
                    <p className="text-xs text-coc-muted">
                      解決日: {new Date(goal.resolved_at).toLocaleDateString("ja-JP")}
                    </p>
                  )}
                </div>
              </div>

              {goal.status === "pending" && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => updateStatus(goal.id, "achieved")}
                    className="flex items-center gap-1.5 rounded-md border border-green-700 bg-green-950/30 px-3 py-1.5 text-xs font-semibold text-green-300 hover:bg-green-900/40 transition-colors"
                  >
                    <CheckCircle2 size={13} />
                    達成
                  </button>
                  <button
                    onClick={() => updateStatus(goal.id, "failed")}
                    className="flex items-center gap-1.5 rounded-md border border-red-700 bg-red-950/30 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-900/40 transition-colors"
                  >
                    <XCircle size={13} />
                    未達
                  </button>
                  <button
                    onClick={() => deleteGoal(goal.id)}
                    className="ml-auto rounded-md border border-coc-border px-3 py-1.5 text-xs text-coc-muted hover:text-red-400 hover:border-red-700 transition-colors"
                  >
                    削除
                  </button>
                </div>
              )}

              {goal.status !== "pending" && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => updateStatus(goal.id, "pending")}
                    className="flex items-center gap-1.5 rounded-md border border-coc-border px-3 py-1.5 text-xs text-coc-muted hover:text-coc-text transition-colors"
                  >
                    進行中に戻す
                  </button>
                  <button
                    onClick={() => deleteGoal(goal.id)}
                    className="ml-auto rounded-md border border-coc-border px-3 py-1.5 text-xs text-coc-muted hover:text-red-400 hover:border-red-700 transition-colors"
                  >
                    削除
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {pendingCount > 0 && activeTab !== "pending" && (
        <p className="mt-4 text-xs text-coc-muted text-center">
          進行中の目標が{pendingCount}件あります。
        </p>
      )}
    </div>
  );
}
