"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Dices } from "lucide-react";
import {
  supabase,
  isSupabaseConfigured,
  Character,
  CharacterSkill,
  ScenarioParticipant,
  SuccessLevel,
} from "@/lib/supabase";

type ParticipantWithCharacter = ScenarioParticipant & {
  characters: Character & { character_skills: CharacterSkill[] };
};

type SuccessDegree = "決定的成功" | "通常成功" | "失敗" | "致命的失敗";

type RollResult = {
  characterId: string;
  characterName: string;
  skillValue: number;
  rollValue: number;
  degree: SuccessDegree;
};

function judge(roll: number, skillValue: number): SuccessDegree {
  const isFumble = skillValue < 50 ? roll >= 96 : roll === 100;
  if (isFumble) return "致命的失敗";
  if (roll <= Math.floor(skillValue / 5)) return "決定的成功";
  if (roll <= skillValue) return "通常成功";
  return "失敗";
}

const DEGREE_TO_LEVEL: Record<SuccessDegree, SuccessLevel> = {
  "決定的成功": "critical_success",
  "通常成功": "success",
  "失敗": "failure",
  "致命的失敗": "fumble",
};

const DEGREE_STYLE: Record<SuccessDegree, { border: string; text: string; bg: string }> = {
  "決定的成功": { border: "border-yellow-400", text: "text-yellow-400", bg: "bg-yellow-400/5" },
  "通常成功":   { border: "border-green-500",  text: "text-green-400",  bg: "bg-green-500/5"  },
  "失敗":       { border: "border-coc-border",  text: "text-coc-muted",  bg: "bg-coc-raised"   },
  "致命的失敗": { border: "border-red-600",     text: "text-red-500",    bg: "bg-red-600/5"    },
};

const DEGREE_ORDER: SuccessDegree[] = ["決定的成功", "通常成功", "失敗", "致命的失敗"];

export default function GroupRollPage() {
  const params = useParams<{ id: string }>();
  const scenarioId = params.id;

  const [scenarioTitle, setScenarioTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState<ParticipantWithCharacter[]>([]);
  const [skillName, setSkillName] = useState("");
  const [results, setResults] = useState<RollResult[]>([]);
  const [rolling, setRolling] = useState(false);
  const [lastSkill, setLastSkill] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    (async () => {
      const { data: scenario } = await supabase
        .from("scenarios")
        .select("title")
        .eq("id", scenarioId)
        .single();
      setScenarioTitle(scenario?.title ?? "");

      const { data } = await supabase
        .from("scenario_participants")
        .select("*, characters(*, character_skills(*))")
        .eq("scenario_id", scenarioId);

      setParticipants((data ?? []) as ParticipantWithCharacter[]);
      setLoading(false);
    })();
  }, [scenarioId]);

  const allSkillNames = Array.from(
    new Set(
      participants.flatMap((p) =>
        (p.characters?.character_skills ?? []).map((s) => s.skill_name)
      )
    )
  ).sort();

  async function rollAll() {
    if (!skillName.trim() || rolling) return;
    setRolling(true);

    const now = new Date().toISOString();
    const newResults: RollResult[] = [];
    const insertRows: {
      character_id: string;
      skill_name: string;
      skill_value: number;
      roll_value: number;
      success_level: SuccessLevel;
      rolled_at: string;
    }[] = [];

    for (const p of participants) {
      const char = p.characters;
      if (!char) continue;

      const skill = (char.character_skills ?? []).find(
        (s) => s.skill_name === skillName.trim()
      );
      const skillValue = skill?.current_value ?? 0;
      const roll = Math.floor(Math.random() * 100) + 1;
      const degree = judge(roll, skillValue);

      newResults.push({
        characterId: char.id,
        characterName: char.name,
        skillValue,
        rollValue: roll,
        degree,
      });

      insertRows.push({
        character_id: char.id,
        skill_name: skillName.trim(),
        skill_value: skillValue,
        roll_value: roll,
        success_level: DEGREE_TO_LEVEL[degree],
        rolled_at: now,
      });
    }

    if (isSupabaseConfigured && insertRows.length > 0) {
      await supabase.from("dice_rolls").insert(insertRows);
    }

    setLastSkill(skillName.trim());
    setResults(newResults);
    setRolling(false);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-sm text-coc-muted">読み込み中...</p>
      </div>
    );
  }

  const grouped = DEGREE_ORDER.reduce<Record<SuccessDegree, RollResult[]>>(
    (acc, d) => {
      acc[d] = results.filter((r) => r.degree === d);
      return acc;
    },
    { "決定的成功": [], "通常成功": [], "失敗": [], "致命的失敗": [] }
  );

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
          <Dices size={20} className="text-coc-gold" />
          グループロール
        </h1>
        <p className="text-xs text-coc-muted mt-1">
          参加者全員に同一の技能判定を一括実行します
        </p>
      </div>

      {participants.length === 0 ? (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-8 text-center">
          <p className="text-coc-muted text-sm">参加キャラクターが登録されていません。</p>
          <Link
            href={`/scenarios/${scenarioId}/participants`}
            className="mt-3 inline-block text-xs text-coc-gold hover:underline"
          >
            参加キャラクターを追加 →
          </Link>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4 mb-4">
            <p className="text-xs text-coc-muted mb-3">判定する技能</p>
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="text"
                  list="skill-list"
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  placeholder="技能名を入力または選択..."
                  className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder-coc-muted focus:border-coc-gold focus:outline-none"
                />
                <datalist id="skill-list">
                  {allSkillNames.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>
              <button
                onClick={rollAll}
                disabled={!skillName.trim() || rolling}
                className="flex items-center gap-2 rounded-lg border border-coc-gold bg-coc-gold/10 px-4 py-2 text-sm font-medium text-coc-gold hover:bg-coc-gold/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Dices size={16} />
                全員ロール
              </button>
            </div>
          </div>

          <p className="text-xs text-coc-muted mb-6">参加者: {participants.length}名</p>

          {results.length > 0 && (
            <div className="flex flex-col gap-4">
              <p className="text-xs font-medium text-coc-muted uppercase tracking-widest">
                判定結果 — {lastSkill}
              </p>
              {DEGREE_ORDER.map((degree) => {
                const group = grouped[degree];
                if (group.length === 0) return null;
                const style = DEGREE_STYLE[degree];
                return (
                  <div
                    key={degree}
                    className={`rounded-xl border ${style.border} ${style.bg} px-5 py-4`}
                  >
                    <p className={`text-xs font-semibold ${style.text} mb-3`}>
                      {degree}（{group.length}名）
                    </p>
                    <div className="flex flex-col gap-2">
                      {group.map((r) => (
                        <div
                          key={r.characterId}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-coc-text font-medium">
                            {r.characterName}
                          </span>
                          <div className="flex items-center gap-3 text-xs text-coc-muted">
                            <span>技能値: {r.skillValue}</span>
                            <span className={`font-bold tabular-nums ${style.text}`}>
                              出目: {r.rollValue}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
