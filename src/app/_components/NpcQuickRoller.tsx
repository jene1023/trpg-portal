"use client";

import { useState } from "react";
import { Dice6 } from "lucide-react";
import { supabase, isSupabaseConfigured, SuccessLevel } from "@/lib/supabase";

type SuccessDegree = "決定的成功" | "通常成功" | "失敗" | "致命的失敗";

const DEGREE_TO_LEVEL: Record<SuccessDegree, SuccessLevel> = {
  "決定的成功": "critical_success",
  "通常成功": "success",
  "失敗": "failure",
  "致命的失敗": "fumble",
};

function judge(roll: number, skillValue: number): SuccessDegree {
  const isFumble = skillValue < 50 ? roll >= 96 : roll === 100;
  if (isFumble) return "致命的失敗";
  if (roll <= Math.floor(skillValue / 5)) return "決定的成功";
  if (roll <= skillValue) return "通常成功";
  return "失敗";
}

const DEGREE_STYLE: Record<SuccessDegree, { border: string; text: string; bg: string }> = {
  "決定的成功": { border: "border-yellow-400", text: "text-yellow-400", bg: "bg-yellow-400/5" },
  "通常成功":   { border: "border-green-500",  text: "text-green-400",  bg: "bg-green-500/5"  },
  "失敗":       { border: "border-coc-border",  text: "text-coc-muted",  bg: "bg-coc-raised"   },
  "致命的失敗": { border: "border-red-600",     text: "text-red-500",    bg: "bg-red-600/5"    },
};

type Result = { roll: number; degree: SuccessDegree; skillName: string; skillValue: number };

type PresetSkill = { name: string; value: number };

type Props = { presetSkills?: PresetSkill[]; npcId?: string };

export default function NpcQuickRoller({ presetSkills = [], npcId }: Props) {
  const [skillName, setSkillName] = useState<string>(presetSkills[0]?.name ?? "");
  const [skillValue, setSkillValue] = useState<number>(presetSkills[0]?.value ?? 50);
  const [result, setResult] = useState<Result | null>(null);
  const [rolling, setRolling] = useState(false);
  const [mode, setMode] = useState<"preset" | "custom">(
    presetSkills.length > 0 ? "preset" : "custom"
  );

  function selectPreset(name: string) {
    const found = presetSkills.find((s) => s.name === name);
    if (found) {
      setSkillName(found.name);
      setSkillValue(found.value);
      setResult(null);
    }
  }

  function roll() {
    if (rolling || skillValue <= 0) return;
    setRolling(true);
    setResult(null);
    setTimeout(() => {
      const rolled = Math.floor(Math.random() * 100) + 1;
      const degree = judge(rolled, skillValue);
      setResult({ roll: rolled, degree, skillName, skillValue });
      setRolling(false);

      if (npcId && isSupabaseConfigured) {
        supabase.from("npc_dice_rolls").insert({
          npc_id: npcId,
          skill_name: skillName,
          skill_value: skillValue,
          roll_value: rolled,
          success_level: DEGREE_TO_LEVEL[degree],
          rolled_at: new Date().toISOString(),
        });
      }
    }, 350);
  }

  return (
    <div className="space-y-4">
      {/* モード切替 */}
      {presetSkills.length > 0 && (
        <div className="flex gap-2 text-sm">
          <button
            onClick={() => { setMode("preset"); setResult(null); }}
            className={`px-3 py-1 rounded-md border transition-colors ${
              mode === "preset"
                ? "border-coc-gold text-coc-gold bg-coc-gold/10"
                : "border-coc-border text-coc-muted hover:text-coc-text"
            }`}
          >
            能力値から選ぶ
          </button>
          <button
            onClick={() => { setMode("custom"); setSkillName(""); setSkillValue(50); setResult(null); }}
            className={`px-3 py-1 rounded-md border transition-colors ${
              mode === "custom"
                ? "border-coc-gold text-coc-gold bg-coc-gold/10"
                : "border-coc-border text-coc-muted hover:text-coc-text"
            }`}
          >
            任意入力
          </button>
        </div>
      )}

      {/* プリセット選択 */}
      {mode === "preset" && presetSkills.length > 0 && (
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="text-xs text-coc-muted block mb-1">能力値を選んで判定</label>
            <select
              value={skillName}
              onChange={(e) => selectPreset(e.target.value)}
              className="w-full rounded-md border border-coc-border bg-coc-raised text-coc-text text-sm px-2 py-1.5 focus:outline-none focus:border-coc-gold"
            >
              {presetSkills.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.name}（{s.value}）
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={roll}
            disabled={rolling}
            className="flex items-center gap-1.5 rounded-md border border-coc-gold text-coc-gold px-3 py-1.5 text-sm font-medium hover:bg-coc-gold/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <Dice6 size={14} className={rolling ? "animate-spin" : ""} />
            判定
          </button>
        </div>
      )}

      {/* 任意入力 */}
      {mode === "custom" && (
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="text-xs text-coc-muted block mb-1">技能名</label>
            <input
              type="text"
              value={skillName}
              onChange={(e) => { setSkillName(e.target.value); setResult(null); }}
              placeholder="例: 目星"
              className="w-full rounded-md border border-coc-border bg-coc-raised text-coc-text text-sm px-2 py-1.5 focus:outline-none focus:border-coc-gold"
            />
          </div>
          <div className="w-24">
            <label className="text-xs text-coc-muted block mb-1">技能値（%）</label>
            <input
              type="number"
              min={1}
              max={100}
              value={skillValue}
              onChange={(e) => { setSkillValue(Number(e.target.value)); setResult(null); }}
              className="w-full rounded-md border border-coc-border bg-coc-raised text-coc-text text-sm px-2 py-1.5 focus:outline-none focus:border-coc-gold"
            />
          </div>
          <button
            onClick={roll}
            disabled={rolling || !skillName.trim() || skillValue <= 0}
            className="flex items-center gap-1.5 rounded-md border border-coc-gold text-coc-gold px-3 py-1.5 text-sm font-medium hover:bg-coc-gold/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <Dice6 size={14} className={rolling ? "animate-spin" : ""} />
            判定
          </button>
        </div>
      )}

      {result && (
        <div
          className={`rounded-md border px-4 py-3 flex items-center justify-between transition-all ${DEGREE_STYLE[result.degree].border} ${DEGREE_STYLE[result.degree].bg}`}
        >
          <div>
            <p className="text-xs text-coc-muted mb-0.5">
              {result.skillName}（{result.skillValue}）
            </p>
            <p className={`font-bold text-base ${DEGREE_STYLE[result.degree].text}`}>
              {result.degree}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-coc-muted mb-0.5">ロール</p>
            <p className={`font-cinzel text-2xl font-bold ${DEGREE_STYLE[result.degree].text}`}>
              {result.roll}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
