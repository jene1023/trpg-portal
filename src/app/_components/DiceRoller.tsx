"use client";

import { useState } from "react";
import { CharacterSkill, SuccessLevel, supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Dice6 } from "lucide-react";

type SuccessDegree = "決定的成功" | "通常成功" | "失敗" | "致命的失敗";
type RollType = "normal" | "bonus" | "penalty";

const ROLL_TYPE_LABEL: Record<RollType, string> = {
  normal: "通常",
  bonus: "ボーナス",
  penalty: "ペナルティ",
};

function judge(roll: number, skillValue: number): SuccessDegree {
  const isFumble = skillValue < 50 ? roll >= 96 : roll === 100;
  if (isFumble) return "致命的失敗";
  if (roll <= Math.floor(skillValue / 5)) return "決定的成功";
  if (roll <= skillValue) return "通常成功";
  return "失敗";
}

function rollD10(): number {
  return Math.floor(Math.random() * 10);
}

function rollPercentile(rollType: RollType): number {
  const ones = rollD10();
  const tensRolls = rollType === "normal" ? [rollD10()] : [rollD10(), rollD10()];
  const tens = rollType === "penalty" ? Math.max(...tensRolls) : Math.min(...tensRolls);
  const value = tens * 10 + ones;
  return value === 0 ? 100 : value;
}

const DEGREE_STYLE: Record<SuccessDegree, { border: string; text: string; bg: string }> = {
  "決定的成功": { border: "border-yellow-400", text: "text-yellow-400", bg: "bg-yellow-400/5" },
  "通常成功":   { border: "border-green-500",  text: "text-green-400",  bg: "bg-green-500/5"  },
  "失敗":       { border: "border-coc-border",  text: "text-coc-muted",  bg: "bg-coc-raised"   },
  "致命的失敗": { border: "border-red-600",     text: "text-red-500",    bg: "bg-red-600/5"    },
};

type Result = { roll: number; degree: SuccessDegree; skillName: string; skillValue: number };

const DEGREE_TO_LEVEL: Record<SuccessDegree, SuccessLevel> = {
  "決定的成功": "critical_success",
  "通常成功": "success",
  "失敗": "failure",
  "致命的失敗": "fumble",
};

type Props = { skills: CharacterSkill[]; characterId?: string };

export default function DiceRoller({ skills, characterId }: Props) {
  const [selectedId, setSelectedId] = useState<string>(skills[0]?.id ?? "");
  const [rollType, setRollType] = useState<RollType>("normal");
  const [result, setResult] = useState<Result | null>(null);
  const [rolling, setRolling] = useState(false);

  if (skills.length === 0) return null;

  const selected = skills.find((s) => s.id === selectedId) ?? skills[0];

  function roll() {
    if (rolling) return;
    setRolling(true);
    setResult(null);
    setTimeout(() => {
      const rolled = rollPercentile(rollType);
      const degree = judge(rolled, selected.current_value);
      setResult({
        roll: rolled,
        degree,
        skillName: selected.skill_name,
        skillValue: selected.current_value,
      });
      setRolling(false);

      if (characterId && isSupabaseConfigured) {
        supabase.from("dice_rolls").insert({
          character_id: characterId,
          skill_name: rollType === "normal" ? selected.skill_name : `${selected.skill_name}（${ROLL_TYPE_LABEL[rollType]}）`,
          skill_value: selected.current_value,
          roll_value: rolled,
          success_level: DEGREE_TO_LEVEL[degree],
          rolled_at: new Date().toISOString(),
        });
      }
    }, 350);
  }

  return (
    <div className="space-y-3">
      <div className="flex rounded-md overflow-hidden border border-coc-border text-xs font-medium">
        {(["normal", "bonus", "penalty"] as RollType[]).map((t) => (
          <button
            key={t}
            onClick={() => setRollType(t)}
            className={`flex-1 py-1.5 transition-colors ${
              rollType === t ? "bg-coc-gold/10 text-coc-gold" : "text-coc-muted hover:text-coc-text"
            }`}
          >
            {ROLL_TYPE_LABEL[t]}
          </button>
        ))}
      </div>

      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="text-xs text-coc-muted block mb-1">技能を選んで判定</label>
          <select
            value={selectedId}
            onChange={(e) => {
              setSelectedId(e.target.value);
              setResult(null);
            }}
            className="w-full rounded-md border border-coc-border bg-coc-raised text-coc-text text-sm px-2 py-1.5 focus:outline-none focus:border-coc-gold"
          >
            {[...skills]
              .sort((a, b) => a.skill_name.localeCompare(b.skill_name, "ja"))
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.skill_name}（{s.current_value}%）
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

      {result && (
        <div
          className={`rounded-md border px-4 py-3 flex items-center justify-between transition-all ${DEGREE_STYLE[result.degree].border} ${DEGREE_STYLE[result.degree].bg}`}
        >
          <div>
            <p className="text-xs text-coc-muted mb-0.5">
              {result.skillName}（{result.skillValue}%）
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
