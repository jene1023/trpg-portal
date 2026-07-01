"use client";

import { useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { CharacterSkill, SkillGoal } from "@/lib/supabase";
import { Trash2, Plus } from "lucide-react";

type Props = {
  characterId: string;
  skills: CharacterSkill[];
  initialGoals: SkillGoal[];
};

export default function SkillGoalTracker({ characterId, skills, initialGoals }: Props) {
  const [goals, setGoals] = useState<SkillGoal[]>(initialGoals);
  const [skillName, setSkillName] = useState("");
  const [targetValue, setTargetValue] = useState<number>(60);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const skillMap = new Map(skills.map((s) => [s.skill_name, s.current_value]));

  async function addGoal() {
    if (!isSupabaseConfigured) return;
    if (!skillName.trim()) { setError("技能名を選択してください"); return; }
    if (targetValue < 1 || targetValue > 99) { setError("目標値は1〜99の範囲で入力してください"); return; }
    if (goals.some((g) => g.skill_name === skillName)) { setError("その技能にはすでに目標が設定されています"); return; }

    setSaving(true);
    setError("");
    const { data, error: err } = await supabase
      .from("skill_goals")
      .insert({ character_id: characterId, skill_name: skillName, target_value: targetValue })
      .select()
      .single();
    setSaving(false);

    if (err || !data) { setError("保存に失敗しました"); return; }
    setGoals((prev) => [...prev, data as SkillGoal]);
    setSkillName("");
    setTargetValue(60);
  }

  async function removeGoal(id: string) {
    if (!isSupabaseConfigured) return;
    await supabase.from("skill_goals").delete().eq("id", id);
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }

  const sortedGoals = [...goals].sort((a, b) => a.skill_name.localeCompare(b.skill_name, "ja"));

  return (
    <div className="space-y-6">
      {/* 目標一覧 */}
      {sortedGoals.length === 0 ? (
        <p className="text-sm text-coc-muted text-center py-6">技能目標がまだ設定されていません</p>
      ) : (
        <div className="space-y-3">
          {sortedGoals.map((goal) => {
            const current = skillMap.get(goal.skill_name) ?? 0;
            const pct = Math.min(100, Math.round((current / goal.target_value) * 100));
            const achieved = current >= goal.target_value;
            return (
              <div
                key={goal.id}
                className={`rounded-lg border p-3 space-y-2 ${
                  achieved
                    ? "border-green-700/60 bg-green-950/20"
                    : "border-coc-border bg-coc-surface"
                }`}
              >
                <div className="flex items-center justify-between text-sm">
                  <span className={`font-semibold ${achieved ? "text-green-300" : "text-coc-text"}`}>
                    {goal.skill_name}
                    {achieved && (
                      <span className="ml-2 rounded bg-green-900/60 border border-green-700 px-1.5 py-0.5 text-xs font-semibold text-green-300">
                        達成
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-coc-muted tabular-nums">
                      {current} / {goal.target_value}（{pct}%）
                    </span>
                    <button
                      onClick={() => removeGoal(goal.id)}
                      className="text-coc-muted hover:text-red-400 transition-colors"
                      aria-label="削除"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-coc-raised overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      achieved ? "bg-green-500" : "bg-coc-gold"
                    }`}
                    style={{ width: `calc(${pct}%)` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 追加フォーム */}
      <div className="rounded-lg border border-coc-border bg-coc-surface p-4 space-y-3">
        <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest">目標を追加</h2>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2 items-end">
          <div>
            <label className="text-xs text-coc-muted mb-1 block">技能名</label>
            {skills.length > 0 ? (
              <select
                value={skillName}
                onChange={(e) => setSkillName(e.target.value)}
                className="w-full rounded-md border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text focus:outline-none focus:border-coc-gold/50"
              >
                <option value="">— 選択 —</option>
                {skills
                  .filter((s) => !goals.some((g) => g.skill_name === s.skill_name))
                  .sort((a, b) => a.skill_name.localeCompare(b.skill_name, "ja"))
                  .map((s) => (
                    <option key={s.id} value={s.skill_name}>
                      {s.skill_name}（現在値: {s.current_value}）
                    </option>
                  ))}
              </select>
            ) : (
              <input
                type="text"
                value={skillName}
                onChange={(e) => setSkillName(e.target.value)}
                placeholder="技能名を入力"
                className="w-full rounded-md border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text focus:outline-none focus:border-coc-gold/50"
              />
            )}
          </div>
          <div>
            <label className="text-xs text-coc-muted mb-1 block">目標値</label>
            <input
              type="number"
              min={1}
              max={99}
              value={targetValue}
              onChange={(e) => setTargetValue(Number(e.target.value))}
              className="w-24 rounded-md border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text focus:outline-none focus:border-coc-gold/50"
            />
          </div>
          <button
            onClick={addGoal}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-md bg-coc-gold/20 border border-coc-gold/40 px-3 py-2 text-sm text-coc-gold hover:bg-coc-gold/30 transition-colors disabled:opacity-50"
          >
            <Plus size={14} />
            追加
          </button>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    </div>
  );
}
