"use client";

import { useState } from "react";
import { CharacterSkill } from "@/lib/supabase";
import { Dice6 } from "lucide-react";

type SuccessDegree = "決定的成功" | "通常成功" | "失敗" | "致命的失敗";

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

type Props = { skills: CharacterSkill[] };

export default function DiceRoller({ skills }: Props) {
  const [selectedId, setSelectedId] = useState<string>(skills[0]?.id ?? "");
  const [result, setResult] = useState<Result | null>(null);
  const [rolling, setRolling] = useState(false);

  if (skills.length === 0) return null;

  const selected = skills.find((s) => s.id === selectedId) ?? skills[0];

  function roll() {
    if (rolling) return;
    setRolling(true);
    setResult(null);
    setTimeout(() => {
      const rolled = Math.floor(Math.random() * 100) + 1;
      setResult({
        roll: rolled,
        degree: judge(rolled, selected.current_value),
        skillName: selected.skill_name,
        skillValue: selected.current_value,
      });
      setRolling(false);
    }, 350);
  }

  return (
    <div className="space-y-3">
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
