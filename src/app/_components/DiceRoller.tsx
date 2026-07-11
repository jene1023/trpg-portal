"use client";

import { useState, useEffect, useRef } from "react";
import { CharacterSkill, SuccessLevel, supabase, isSupabaseConfigured, createSupabaseBrowserClient, DiceMacro, Character } from "@/lib/supabase";
import { evaluateDiceExpression } from "@/lib/diceExpression";
import { Dice6, BookOpen } from "lucide-react";

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

type MacroResult = { macroId: string; name: string; expression: string; resolvedExpression: string; total: number; detail: string };

function resolveExpression(expression: string, character: Character | null): string {
  if (!character) return expression;
  const map: Record<string, number> = {
    STR: character.str, CON: character.con, POW: character.pow, DEX: character.dex,
    APP: character.app, SIZ: character.siz, INT: character.int_stat, EDU: character.edu,
    HP: character.hp_current, MP: character.mp_current, SAN: character.san_current, LUCK: character.luck,
  };
  return expression.replace(/\{([A-Z_]+)\}/g, (_, key) => key in map ? String(map[key]) : `{${key}}`);
}

type Props = { skills: CharacterSkill[]; characterId?: string; scenarioId?: string; characterName?: string };

export default function DiceRoller({ skills, characterId, scenarioId, characterName }: Props) {
  const [activeTab, setActiveTab] = useState<"skill" | "macro">("skill");
  const [selectedId, setSelectedId] = useState<string>(skills[0]?.id ?? "");
  const [rollType, setRollType] = useState<RollType>("normal");
  const [result, setResult] = useState<Result | null>(null);
  const [rolling, setRolling] = useState(false);
  const [macros, setMacros] = useState<DiceMacro[]>([]);
  const [macroRolling, setMacroRolling] = useState<string | null>(null);
  const [macroResult, setMacroResult] = useState<MacroResult | null>(null);
  const [character, setCharacter] = useState<Character | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const effectiveId = scenarioId ?? (typeof window !== "undefined" ? localStorage.getItem("coc_active_scenario") : null);
    if (!effectiveId) return;
    const ch = supabase.channel(`dice-broadcast-${effectiveId}`);
    ch.subscribe();
    channelRef.current = ch;
    return () => {
      supabase.removeChannel(ch);
      channelRef.current = null;
    };
  }, [scenarioId]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const client = createSupabaseBrowserClient();
    client.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      const uid = data.user.id;
      supabase
        .from("dice_macros")
        .select("*")
        .or(`owner_id.eq.${uid},is_public.eq.true`)
        .order("created_at", { ascending: true })
        .then(({ data: rows }) => { if (rows) setMacros(rows); });
    });
  }, []);

  useEffect(() => {
    if (!characterId || !isSupabaseConfigured) return;
    supabase
      .from("characters")
      .select("*")
      .eq("id", characterId)
      .single()
      .then(({ data }) => { if (data) setCharacter(data); });
  }, [characterId]);

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
      if (channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "dice_roll",
          payload: {
            characterName: characterName ?? "探索者",
            skillName: rollType === "normal" ? selected.skill_name : `${selected.skill_name}（${ROLL_TYPE_LABEL[rollType]}）`,
            skillValue: selected.current_value,
            rollValue: rolled,
            degree,
          },
        });
      }
    }, 350);
  }

  function rollMacro(macro: DiceMacro) {
    if (macroRolling) return;
    setMacroRolling(macro.id);
    setMacroResult(null);
    setTimeout(() => {
      const resolved = resolveExpression(macro.expression, character);
      const evaluated = evaluateDiceExpression(resolved);
      setMacroResult({
        macroId: macro.id,
        name: macro.name,
        expression: macro.expression,
        resolvedExpression: resolved !== macro.expression ? resolved : "",
        total: evaluated.total,
        detail: evaluated.detail,
      });
      setMacroRolling(null);
      if (channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "dice_roll",
          payload: {
            characterName: characterName ?? "探索者",
            skillName: `マクロ: ${macro.name}`,
            skillValue: 0,
            rollValue: evaluated.total,
            degree: `合計 ${evaluated.total}`,
          },
        });
      }
    }, 300);
  }

  return (
    <div className="space-y-3">
      {/* タブ切替 */}
      <div className="flex rounded-md overflow-hidden border border-coc-border text-xs font-medium">
        <button
          onClick={() => setActiveTab("skill")}
          className={`flex-1 py-1.5 transition-colors ${activeTab === "skill" ? "bg-coc-gold/10 text-coc-gold" : "text-coc-muted hover:text-coc-text"}`}
        >
          技能判定
        </button>
        <button
          onClick={() => setActiveTab("macro")}
          className={`flex items-center justify-center gap-1 flex-1 py-1.5 transition-colors ${activeTab === "macro" ? "bg-coc-gold/10 text-coc-gold" : "text-coc-muted hover:text-coc-text"}`}
        >
          <BookOpen size={11} />
          マイマクロ
          {macros.length > 0 && <span className="text-xs opacity-60">({macros.length})</span>}
        </button>
      </div>

      {/* マイマクロタブ */}
      {activeTab === "macro" && (
        <div className="space-y-2">
          {macros.length === 0 ? (
            <p className="text-xs text-coc-muted text-center py-4">
              マクロがありません。<a href="/dice/macros" className="text-coc-gold hover:underline">マクロ管理</a>から追加できます。
            </p>
          ) : (
            <>
              {macros.map((m) => (
                <div key={m.id} className="flex items-start gap-2 rounded-md border border-coc-border bg-coc-raised px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-coc-text truncate">{m.name}</p>
                    <p className="text-xs text-coc-muted font-mono">
                      {m.expression}
                      {character && m.expression.includes("{") && (
                        <span className="text-coc-muted/50"> → {resolveExpression(m.expression, character)}</span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => rollMacro(m)}
                    disabled={!!macroRolling}
                    className="flex items-center gap-1 rounded border border-coc-gold text-coc-gold px-2 py-1 text-xs hover:bg-coc-gold/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                  >
                    <Dice6 size={11} className={macroRolling === m.id ? "animate-spin" : ""} />
                    実行
                  </button>
                </div>
              ))}
              {macroResult && (
                <div className="rounded-md border border-coc-border bg-coc-raised px-3 py-2 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-coc-muted">
                      {macroResult.name}（{macroResult.expression}{macroResult.resolvedExpression ? ` → ${macroResult.resolvedExpression}` : ""}）
                    </p>
                    <p className="text-xs text-coc-muted/70 font-mono">{macroResult.detail}</p>
                  </div>
                  <p className="font-cinzel text-2xl font-bold text-coc-text ml-3">{macroResult.total}</p>
                </div>
              )}
              <a href="/dice/macros" className="block text-center text-xs text-coc-muted hover:text-coc-gold transition-colors py-1">
                マクロを管理する →
              </a>
            </>
          )}
        </div>
      )}

      {/* 技能判定タブ */}
      {activeTab === "skill" && (
        <>
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
                {(() => {
                  const favorites = skills.filter((s) => s.is_favorite);
                  const others = [...skills]
                    .filter((s) => !s.is_favorite)
                    .sort((a, b) => a.skill_name.localeCompare(b.skill_name, "ja"));
                  return (
                    <>
                      {favorites.length > 0 && (
                        <optgroup label="★ お気に入り">
                          {favorites.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.skill_name}（{s.current_value}%）
                            </option>
                          ))}
                        </optgroup>
                      )}
                      <optgroup label={favorites.length > 0 ? "すべて" : "技能"}>
                        {others.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.skill_name}（{s.current_value}%）
                          </option>
                        ))}
                      </optgroup>
                    </>
                  );
                })()}
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

          {selected && (
            <div className="flex gap-3 text-xs text-coc-muted bg-coc-raised border border-coc-border rounded-md px-3 py-1.5">
              <span>通常: <span className="text-coc-text font-medium">{selected.current_value}%</span></span>
              <span>困難: <span className="text-coc-text font-medium">{Math.floor(selected.current_value / 2)}%</span></span>
              <span>極限: <span className="text-coc-text font-medium">{Math.floor(selected.current_value / 5)}%</span></span>
            </div>
          )}

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
        </>
      )}
    </div>
  );
}
