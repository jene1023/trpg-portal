"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Target, CheckCircle2, Circle, Trash2 } from "lucide-react";
import { supabase, isSupabaseConfigured, ScenarioObjective } from "@/lib/supabase";

type Props = { params: Promise<{ id: string }> };

export default function ScenarioObjectivesPage({ params }: Props) {
  const [scenarioId, setScenarioId] = useState("");
  const [scenarioTitle, setScenarioTitle] = useState("");
  const [objectives, setObjectives] = useState<ScenarioObjective[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<"main" | "sub">("main");
  const [saving, setSaving] = useState(false);

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
          .from("scenario_objectives")
          .select("*")
          .eq("scenario_id", id)
          .order("sort_order", { ascending: true }),
      ]).then(([scenarioRes, objectivesRes]) => {
        if (scenarioRes.data) setScenarioTitle(scenarioRes.data.title);
        setObjectives((objectivesRes.data ?? []) as ScenarioObjective[]);
        setLoading(false);
      });
    });
  }, [params]);

  async function toggleAchieved(obj: ScenarioObjective) {
    if (!isSupabaseConfigured) return;
    const newAchieved = !obj.is_achieved;
    const update = {
      is_achieved: newAchieved,
      achieved_at: newAchieved ? new Date().toISOString() : null,
    };
    await supabase.from("scenario_objectives").update(update).eq("id", obj.id);
    setObjectives((prev) =>
      prev.map((o) => (o.id === obj.id ? { ...o, ...update } : o))
    );
  }

  async function addObjective() {
    if (!newTitle.trim() || !isSupabaseConfigured) return;
    setSaving(true);
    const maxOrder =
      objectives.length > 0
        ? Math.max(...objectives.map((o) => o.sort_order))
        : -1;
    const { data, error } = await supabase
      .from("scenario_objectives")
      .insert({
        scenario_id: scenarioId,
        title: newTitle.trim(),
        type: newType,
        is_achieved: false,
        achieved_at: null,
        sort_order: maxOrder + 1,
      })
      .select()
      .single();
    if (!error && data) {
      setObjectives((prev) => [...prev, data as ScenarioObjective]);
      setNewTitle("");
      setAdding(false);
    }
    setSaving(false);
  }

  async function deleteObjective(id: string) {
    if (!isSupabaseConfigured) return;
    await supabase.from("scenario_objectives").delete().eq("id", id);
    setObjectives((prev) => prev.filter((o) => o.id !== id));
  }

  const mainObjectives = objectives.filter((o) => o.type === "main");
  const subObjectives = objectives.filter((o) => o.type === "sub");
  const total = objectives.length;
  const achieved = objectives.filter((o) => o.is_achieved).length;
  const progressPct = total > 0 ? Math.round((achieved / total) * 100) : 0;

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-coc-muted text-sm">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/scenarios/${scenarioId}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          シナリオ詳細
        </Link>
      </div>

      <div className="mb-6">
        <p className="text-xs text-coc-muted mb-1">{scenarioTitle}</p>
        <h1 className="font-cinzel text-xl font-bold text-coc-text flex items-center gap-2">
          <Target size={20} className="text-coc-gold" />
          目標トラッカー
        </h1>
        <p className="text-xs text-coc-muted mt-1">
          シナリオのメイン・サブ目標を登録し、達成状況をチェックしながら進捗を可視化します。
        </p>
      </div>

      {total > 0 && (
        <div className="mb-6 rounded-xl border border-coc-border bg-coc-surface px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-coc-text">達成率</span>
            <span className="text-sm font-bold text-coc-gold">
              {achieved}/{total}（{progressPct}%）
            </span>
          </div>
          <div className="h-3 rounded-full bg-coc-border overflow-hidden">
            <div
              className="h-full rounded-full bg-coc-gold transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      <div className="mb-5">
        <h2 className="text-xs font-semibold text-coc-gold uppercase tracking-widest mb-2">
          メイン目標
        </h2>
        <div className="space-y-2">
          {mainObjectives.length === 0 && (
            <p className="text-sm text-coc-muted py-3 text-center">
              メイン目標がありません
            </p>
          )}
          {mainObjectives.map((obj) => (
            <ObjectiveCard
              key={obj.id}
              obj={obj}
              onToggle={() => toggleAchieved(obj)}
              onDelete={() => deleteObjective(obj.id)}
            />
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest mb-2">
          サブ目標
        </h2>
        <div className="space-y-2">
          {subObjectives.length === 0 && (
            <p className="text-sm text-coc-muted py-3 text-center">
              サブ目標がありません
            </p>
          )}
          {subObjectives.map((obj) => (
            <ObjectiveCard
              key={obj.id}
              obj={obj}
              onToggle={() => toggleAchieved(obj)}
              onDelete={() => deleteObjective(obj.id)}
            />
          ))}
        </div>
      </div>

      {adding ? (
        <div className="rounded-xl border border-coc-gold-dim bg-coc-raised px-5 py-4 space-y-3">
          <div className="flex gap-2">
            <button
              onClick={() => setNewType("main")}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                newType === "main"
                  ? "bg-coc-gold/20 border-coc-gold text-coc-gold"
                  : "border-coc-border text-coc-muted hover:border-coc-gold hover:text-coc-gold"
              }`}
            >
              メイン
            </button>
            <button
              onClick={() => setNewType("sub")}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                newType === "sub"
                  ? "bg-coc-gold/20 border-coc-gold text-coc-gold"
                  : "border-coc-border text-coc-muted hover:border-coc-gold hover:text-coc-gold"
              }`}
            >
              サブ
            </button>
          </div>
          <input
            type="text"
            placeholder="目標タイトル（例: 犯人を特定する）"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addObjective()}
            className="w-full rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text placeholder-coc-muted focus:border-coc-gold focus:outline-none"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={addObjective}
              disabled={!newTitle.trim() || saving}
              className="flex-1 rounded-lg bg-coc-gold py-2 text-sm font-medium text-black disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              {saving ? "保存中..." : "追加"}
            </button>
            <button
              onClick={() => {
                setAdding(false);
                setNewTitle("");
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
          目標を追加
        </button>
      )}
    </div>
  );
}

function ObjectiveCard({
  obj,
  onToggle,
  onDelete,
}: {
  obj: ScenarioObjective;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
        obj.is_achieved
          ? "border-green-800 bg-green-950/20"
          : "border-coc-border bg-coc-surface"
      }`}
    >
      <button
        onClick={onToggle}
        className="flex-shrink-0 text-coc-muted hover:text-coc-gold transition-colors"
        aria-label={obj.is_achieved ? "未達成に戻す" : "達成済みにする"}
      >
        {obj.is_achieved ? (
          <CheckCircle2 size={20} className="text-green-400" />
        ) : (
          <Circle size={20} />
        )}
      </button>
      <span
        className={`flex-1 text-sm ${
          obj.is_achieved ? "line-through text-coc-muted" : "text-coc-text"
        }`}
      >
        {obj.title}
      </span>
      {obj.is_achieved && obj.achieved_at && (
        <span className="text-xs text-coc-muted flex-shrink-0">
          {new Date(obj.achieved_at).toLocaleDateString("ja-JP")}
        </span>
      )}
      <button
        onClick={onDelete}
        className="flex-shrink-0 p-1 rounded hover:bg-coc-raised text-red-400 transition-colors"
        aria-label="削除"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}
