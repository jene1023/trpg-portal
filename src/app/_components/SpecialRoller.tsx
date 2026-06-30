"use client";

import { useState } from "react";
import { CharacterSkill, SuccessLevel, supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Dice6 } from "lucide-react";

type SuccessDegree = "決定的成功" | "通常成功" | "失敗" | "致命的失敗";
type RollMode = "push" | "opposed";

function judge(roll: number, skillValue: number): SuccessDegree {
  const isFumble = skillValue < 50 ? roll >= 96 : roll === 100;
  if (isFumble) return "致命的失敗";
  if (roll <= Math.floor(skillValue / 5)) return "決定的成功";
  if (roll <= skillValue) return "通常成功";
  return "失敗";
}

const DEGREE_ORDER: SuccessDegree[] = ["致命的失敗", "失敗", "通常成功", "決定的成功"];
const degreeRank = (d: SuccessDegree) => DEGREE_ORDER.indexOf(d);

const DEGREE_TO_LEVEL: Record<SuccessDegree, SuccessLevel> = {
  "決定的成功": "critical_success",
  "通常成功": "success",
  "失敗": "failure",
  "致命的失敗": "fumble",
};

const STYLE: Record<SuccessDegree, { border: string; text: string; bg: string }> = {
  "決定的成功": { border: "border-yellow-400", text: "text-yellow-400", bg: "bg-yellow-400/5" },
  "通常成功":   { border: "border-green-500",  text: "text-green-400",  bg: "bg-green-500/5"  },
  "失敗":       { border: "border-coc-border",  text: "text-coc-muted",  bg: "bg-coc-raised"   },
  "致命的失敗": { border: "border-red-600",     text: "text-red-500",    bg: "bg-red-600/5"    },
};

type Props = { skills: CharacterSkill[]; characterId?: string };

function saveRoll(characterId: string | undefined, skillName: string, skillValue: number, rollValue: number, degree: SuccessDegree) {
  if (!characterId || !isSupabaseConfigured) return;
  supabase.from("dice_rolls").insert({
    character_id: characterId,
    skill_name: skillName,
    skill_value: skillValue,
    roll_value: rollValue,
    success_level: DEGREE_TO_LEVEL[degree],
    rolled_at: new Date().toISOString(),
  });
}

function RollCard({ label, roll, degree }: { label: string; roll: number; degree: SuccessDegree }) {
  return (
    <div className={`rounded-md border px-4 py-3 flex items-center justify-between ${STYLE[degree].border} ${STYLE[degree].bg}`}>
      <div>
        <p className="text-xs text-coc-muted mb-0.5">{label}</p>
        <p className={`font-bold text-base ${STYLE[degree].text}`}>{degree}</p>
      </div>
      <p className={`font-cinzel text-2xl font-bold ${STYLE[degree].text}`}>{roll}</p>
    </div>
  );
}

function PushRoller({ skills, characterId }: Props) {
  const [selectedId, setSelectedId] = useState<string>(skills[0]?.id ?? "");
  const [firstRoll, setFirstRoll] = useState<{ roll: number; degree: SuccessDegree } | null>(null);
  const [pushRoll, setPushRoll] = useState<{ roll: number; degree: SuccessDegree } | null>(null);
  const [rolling, setRolling] = useState(false);

  const selected = skills.find((s) => s.id === selectedId) ?? skills[0];
  const canPush = firstRoll !== null && pushRoll === null;

  function doRoll(isPush: boolean) {
    if (rolling) return;
    setRolling(true);
    if (!isPush) {
      setFirstRoll(null);
      setPushRoll(null);
    }
    setTimeout(() => {
      const rolled = Math.floor(Math.random() * 100) + 1;
      const degree = judge(rolled, selected.current_value);
      const label = isPush ? `${selected.skill_name}（プッシュ）` : selected.skill_name;
      saveRoll(characterId, label, selected.current_value, rolled, degree);
      if (isPush) {
        setPushRoll({ roll: rolled, degree });
      } else {
        setFirstRoll({ roll: rolled, degree });
      }
      setRolling(false);
    }, 350);
  }

  function reset() {
    setFirstRoll(null);
    setPushRoll(null);
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-coc-muted">技能判定に失敗した後、一度だけ再挑戦できます。失敗すると悪化する可能性があります。</p>

      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="text-xs text-coc-muted block mb-1">技能</label>
          <select
            value={selectedId}
            onChange={(e) => { setSelectedId(e.target.value); reset(); }}
            className="w-full rounded-md border border-coc-border bg-coc-raised text-coc-text text-sm px-2 py-1.5 focus:outline-none focus:border-coc-gold"
          >
            {[...skills].sort((a, b) => a.skill_name.localeCompare(b.skill_name, "ja")).map((s) => (
              <option key={s.id} value={s.id}>
                {s.skill_name}（{s.current_value}%）
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => doRoll(false)}
          disabled={rolling}
          className="flex items-center gap-1.5 rounded-md border border-coc-gold text-coc-gold px-3 py-1.5 text-sm font-medium hover:bg-coc-gold/10 transition-colors disabled:opacity-40 shrink-0"
        >
          <Dice6 size={14} className={rolling && !canPush ? "animate-spin" : ""} />
          判定
        </button>

        {canPush && (
          <button
            onClick={() => doRoll(true)}
            disabled={rolling}
            className="flex items-center gap-1.5 rounded-md border border-amber-600 text-amber-400 px-3 py-1.5 text-sm font-medium hover:bg-amber-600/10 transition-colors disabled:opacity-40 shrink-0"
          >
            <Dice6 size={14} className={rolling ? "animate-spin" : ""} />
            プッシュ
          </button>
        )}
      </div>

      {firstRoll && (
        <RollCard
          label={`1回目: ${selected.skill_name}（${selected.current_value}%）`}
          roll={firstRoll.roll}
          degree={firstRoll.degree}
        />
      )}

      {canPush && (
        <p className="text-xs text-amber-400">↑ 失敗した場合はプッシュで再挑戦できます</p>
      )}

      {pushRoll && (
        <RollCard
          label={`プッシュ: ${selected.skill_name}（${selected.current_value}%）`}
          roll={pushRoll.roll}
          degree={pushRoll.degree}
        />
      )}
    </div>
  );
}

function OpposedRoller({ characterId }: { characterId?: string }) {
  const [sideA, setSideA] = useState({ name: "探索者", value: 50 });
  const [sideB, setSideB] = useState({ name: "相手", value: 50 });
  const [result, setResult] = useState<{
    rollA: number; degreeA: SuccessDegree;
    rollB: number; degreeB: SuccessDegree;
    winner: "A" | "B" | "draw" | "both_fail";
  } | null>(null);
  const [rolling, setRolling] = useState(false);

  function rollOpposed() {
    if (rolling) return;
    setRolling(true);
    setResult(null);
    setTimeout(() => {
      const rollA = Math.floor(Math.random() * 100) + 1;
      const rollB = Math.floor(Math.random() * 100) + 1;
      const degreeA = judge(rollA, sideA.value);
      const degreeB = judge(rollB, sideB.value);

      const rankA = degreeRank(degreeA);
      const rankB = degreeRank(degreeB);

      let winner: "A" | "B" | "draw" | "both_fail";
      if (rankA <= 1 && rankB <= 1) {
        winner = "both_fail";
      } else if (rankA > rankB) {
        winner = "A";
      } else if (rankB > rankA) {
        winner = "B";
      } else {
        if (sideA.value > sideB.value) winner = "A";
        else if (sideB.value > sideA.value) winner = "B";
        else winner = "draw";
      }

      setResult({ rollA, degreeA, rollB, degreeB, winner });
      setRolling(false);
      saveRoll(characterId, `対抗: ${sideA.name}`, sideA.value, rollA, degreeA);
    }, 350);
  }

  const WINNER_LABEL: Record<"A" | "B" | "draw" | "both_fail", string> = {
    A: `${sideA.name} の勝利`,
    B: `${sideB.name} の勝利`,
    draw: "引き分け",
    both_fail: "両者失敗",
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-coc-muted">2者が技能値を比べ、高い成功度の側が勝ちます。同成功度の場合は技能値の高い側が勝ちます。</p>

      <div className="grid grid-cols-2 gap-3">
        {(["A", "B"] as const).map((side) => {
          const data = side === "A" ? sideA : sideB;
          const setData = side === "A" ? setSideA : setSideB;
          return (
            <div key={side} className="space-y-1.5">
              <input
                type="text"
                value={data.name}
                onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))}
                placeholder={side === "A" ? "探索者" : "相手"}
                className="w-full rounded-md border border-coc-border bg-coc-raised text-coc-text text-sm px-2 py-1.5 focus:outline-none focus:border-coc-gold"
              />
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={data.value}
                  onChange={(e) => setData((d) => ({ ...d, value: Math.max(1, Math.min(99, Number(e.target.value))) }))}
                  min={1}
                  max={99}
                  className="w-full rounded-md border border-coc-border bg-coc-raised text-coc-text text-sm px-2 py-1.5 focus:outline-none focus:border-coc-gold"
                />
                <span className="text-xs text-coc-muted shrink-0">%</span>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={rollOpposed}
        disabled={rolling}
        className="w-full flex items-center justify-center gap-1.5 rounded-md border border-coc-gold text-coc-gold px-3 py-2 text-sm font-medium hover:bg-coc-gold/10 transition-colors disabled:opacity-40"
      >
        <Dice6 size={14} className={rolling ? "animate-spin" : ""} />
        対抗ロール
      </button>

      {result && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {(["A", "B"] as const).map((side) => {
              const roll = side === "A" ? result.rollA : result.rollB;
              const degree = side === "A" ? result.degreeA : result.degreeB;
              const name = side === "A" ? sideA.name : sideB.name;
              const value = side === "A" ? sideA.value : sideB.value;
              return (
                <div
                  key={side}
                  className={`rounded-md border px-3 py-2 ${STYLE[degree].border} ${STYLE[degree].bg} ${result.winner === side ? "ring-1 ring-coc-gold/50" : ""}`}
                >
                  <p className="text-xs text-coc-muted mb-0.5 truncate">{name}（{value}%）</p>
                  <p className={`font-bold text-sm ${STYLE[degree].text}`}>{degree}</p>
                  <p className={`font-cinzel text-xl font-bold mt-0.5 ${STYLE[degree].text}`}>{roll}</p>
                </div>
              );
            })}
          </div>
          <div
            className={`rounded-md border px-4 py-2 text-center font-semibold text-sm ${
              result.winner === "both_fail" || result.winner === "draw"
                ? "border-coc-border text-coc-muted bg-coc-raised"
                : "border-coc-gold/60 text-coc-gold bg-coc-gold/5"
            }`}
          >
            {WINNER_LABEL[result.winner]}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SpecialRoller({ skills, characterId }: Props) {
  const [mode, setMode] = useState<RollMode>(skills.length > 0 ? "push" : "opposed");

  return (
    <div className="space-y-3">
      <div className="flex rounded-md overflow-hidden border border-coc-border text-xs font-medium">
        {(["push", "opposed"] as RollMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            disabled={m === "push" && skills.length === 0}
            className={`flex-1 py-1.5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
              mode === m
                ? "bg-coc-gold/10 text-coc-gold"
                : "text-coc-muted hover:text-coc-text"
            }`}
          >
            {m === "push" ? "プッシュ" : "対抗ロール"}
          </button>
        ))}
      </div>

      {mode === "push" && skills.length > 0 ? (
        <PushRoller skills={skills} characterId={characterId} />
      ) : mode === "opposed" ? (
        <OpposedRoller characterId={characterId} />
      ) : null}
    </div>
  );
}
