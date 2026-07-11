"use client";

import { useReducer, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { Dices, ChevronRight, ChevronLeft, Check, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import {
  supabase,
  isSupabaseConfigured,
  SkillTemplate,
} from "@/lib/supabase";
import {
  calcHpMax,
  calcMpMax,
  calcSanStart,
  calcDamageBonus,
  calcBuild,
  calcMov,
  calcOccupationPoints6th,
  calcPersonalPoints6th,
} from "@/lib/coc-calc";

const STEPS = [
  "基本情報",
  "能力値ロール",
  "職業選択",
  "技能配分",
  "背景・メモ",
  "確認・完了",
] as const;

type SkillRow = {
  tempId: string;
  skill_name: string;
  base_value: number;
  current_value: number;
  is_occupation: boolean;
  category: string | null;
};

type WizardState = {
  name: string;
  playerName: string;
  occupation: string;
  catchphrase: string;
  age: string;
  gender: string;
  ruleEdition: "6th" | "7th";
  str: number;
  con: number;
  pow: number;
  dex: number;
  app: number;
  siz: number;
  intStat: number;
  edu: number;
  selectedOccupation: string;
  skills: SkillRow[];
  background: string;
  notes: string;
  speechStyle: string;
};

type WizardAction =
  | { type: "SET"; field: keyof WizardState; value: WizardState[keyof WizardState] }
  | { type: "ROLL_ABILITIES" }
  | { type: "SET_SKILLS"; skills: SkillRow[] }
  | { type: "UPDATE_SKILL"; tempId: string; field: Partial<Omit<SkillRow, "tempId">> }
  | { type: "ADD_SKILL" }
  | { type: "REMOVE_SKILL"; tempId: string };

const DEFAULT_SKILLS: SkillRow[] = [
  { tempId: uuidv4(), skill_name: "目星",   base_value: 25, current_value: 25, is_occupation: false, category: null },
  { tempId: uuidv4(), skill_name: "聞き耳", base_value: 20, current_value: 20, is_occupation: false, category: null },
  { tempId: uuidv4(), skill_name: "図書館", base_value: 25, current_value: 25, is_occupation: false, category: null },
  { tempId: uuidv4(), skill_name: "回避",   base_value: 0,  current_value: 0,  is_occupation: false, category: null },
  { tempId: uuidv4(), skill_name: "心理学", base_value: 10, current_value: 10, is_occupation: false, category: null },
  { tempId: uuidv4(), skill_name: "説得",   base_value: 10, current_value: 10, is_occupation: false, category: null },
];

function rollDice(count: number, sides: number): number {
  let total = 0;
  for (let i = 0; i < count; i++) total += Math.floor(Math.random() * sides) + 1;
  return total;
}

function initialState(): WizardState {
  return {
    name: "",
    playerName: "",
    occupation: "",
    catchphrase: "",
    age: "",
    gender: "",
    ruleEdition: "7th",
    str: 50, con: 50, pow: 50, dex: 50, app: 50, siz: 50, intStat: 50, edu: 50,
    selectedOccupation: "",
    skills: DEFAULT_SKILLS,
    background: "",
    notes: "",
    speechStyle: "",
  };
}

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "SET":
      return { ...state, [action.field]: action.value };
    case "ROLL_ABILITIES": {
      const ed = state.ruleEdition;
      return {
        ...state,
        str: rollDice(3, 6) * 5,
        con: rollDice(3, 6) * 5,
        pow: rollDice(3, 6) * 5,
        dex: rollDice(3, 6) * 5,
        app: rollDice(3, 6) * 5,
        siz: rollDice(2, 6) * 5 + 6,
        intStat: rollDice(2, 6) * 5 + 6,
        edu: ed === "6th" ? rollDice(3, 6) * 5 + 6 : rollDice(2, 6) * 5 + 6,
      };
    }
    case "SET_SKILLS":
      return { ...state, skills: action.skills };
    case "UPDATE_SKILL":
      return {
        ...state,
        skills: state.skills.map((s) =>
          s.tempId === action.tempId ? { ...s, ...action.field } : s
        ),
      };
    case "ADD_SKILL":
      return {
        ...state,
        skills: [
          ...state.skills,
          { tempId: uuidv4(), skill_name: "", base_value: 0, current_value: 0, is_occupation: false, category: null },
        ],
      };
    case "REMOVE_SKILL":
      return { ...state, skills: state.skills.filter((s) => s.tempId !== action.tempId) };
    default:
      return state;
  }
}

const inputClass =
  "w-full rounded-md border border-coc-border bg-coc-void px-3 py-2 text-sm text-coc-text placeholder:text-coc-faint focus:outline-none focus:border-coc-gold-dim transition-colors";
const labelClass = "block text-xs text-coc-muted mb-1";
const sectionTitle = "font-cinzel text-sm font-semibold text-coc-muted uppercase tracking-widest mb-4";

export default function WizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [state, dispatch] = useReducer(wizardReducer, undefined, initialState);
  const [skillTemplates, setSkillTemplates] = useState<SkillTemplate[]>([]);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase
      .from("skill_templates")
      .select("*")
      .order("occupation_name", { ascending: true })
      .then(({ data }) => {
        if (data) setSkillTemplates(data as SkillTemplate[]);
      });
  }, []);

  const occupationNames = Array.from(new Set(skillTemplates.map((t) => t.occupation_name)));

  function loadOccupationSkills() {
    if (!state.selectedOccupation) return;
    const rows = skillTemplates.filter((t) => t.occupation_name === state.selectedOccupation);
    const newSkills: SkillRow[] = rows.map((t) => ({
      tempId: uuidv4(),
      skill_name: t.skill_name,
      base_value: 0,
      current_value: 0,
      is_occupation: t.is_occupation,
      category: null,
    }));
    dispatch({ type: "SET_SKILLS", skills: [...DEFAULT_SKILLS, ...newSkills] });
  }

  const hpMax = state.ruleEdition === "6th"
    ? Math.floor((state.con + state.siz) / 2)
    : calcHpMax(state.con, state.siz);
  const mpMax = calcMpMax(state.pow);
  const sanStart = calcSanStart(state.pow);

  const occPoints = state.ruleEdition === "6th"
    ? calcOccupationPoints6th(state.edu)
    : state.edu * 4;
  const personalPoints = state.ruleEdition === "6th"
    ? calcPersonalPoints6th(state.intStat)
    : state.intStat * 2;

  function canAdvance(): boolean {
    if (step === 0) return state.name.trim().length > 0;
    return true;
  }

  function advance() {
    if (step === 2 && state.selectedOccupation) {
      loadOccupationSkills();
    }
    if (step === 0 && !state.name.trim()) {
      setErrorMsg("キャラクター名を入力してください");
      return;
    }
    setErrorMsg("");
    setStep((s) => s + 1);
  }

  function back() {
    setErrorMsg("");
    setStep((s) => s - 1);
  }

  async function handleSave() {
    if (!isSupabaseConfigured) {
      setErrorMsg("Supabase が設定されていません");
      return;
    }
    setSaving(true);
    setErrorMsg("");
    const charId = uuidv4();
    try {
      const payload = {
        id: charId,
        name: state.name.trim(),
        player_name: state.playerName.trim() || null,
        occupation: state.occupation.trim() || null,
        catchphrase: state.catchphrase.trim() || null,
        age: state.age ? parseInt(state.age) : null,
        gender: state.gender.trim() || null,
        status: "alive" as const,
        rule_edition: state.ruleEdition,
        str: state.str,
        con: state.con,
        pow: state.pow,
        dex: state.dex,
        app: state.app,
        siz: state.siz,
        int_stat: state.intStat,
        edu: state.edu,
        hp_max: hpMax,
        hp_current: hpMax,
        mp_max: mpMax,
        mp_current: mpMax,
        san_start: sanStart,
        san_current: sanStart,
        san_max: 99,
        luck: state.pow,
        background: state.background.trim() || null,
        notes: state.notes.trim() || null,
        speech_style: state.speechStyle.trim() || null,
      };

      const { error } = await supabase.from("characters").insert(payload);
      if (error) throw error;

      const validSkills = state.skills.filter((s) => s.skill_name.trim());
      if (validSkills.length > 0) {
        const { error: skillErr } = await supabase.from("character_skills").insert(
          validSkills.map((s) => ({
            character_id: charId,
            skill_name: s.skill_name.trim(),
            base_value: s.base_value,
            current_value: s.current_value,
            is_occupation: s.is_occupation,
            category: s.category || null,
          }))
        );
        if (skillErr) throw skillErr;
      }

      router.push(`/characters/${charId}`);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  const progressPct = Math.round((step / (STEPS.length - 1)) * 100);

  function StatInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
    return (
      <div>
        <label className={labelClass}>{label}</label>
        <input
          type="number"
          min={1}
          max={99}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          className={`${inputClass} text-center`}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-cinzel text-2xl font-bold text-coc-text">キャラクター作成ウィザード</h1>
        <Link href="/characters/new" className="text-xs text-coc-muted hover:text-coc-text transition-colors">
          通常フォームへ
        </Link>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-coc-muted">
          {STEPS.map((s, i) => (
            <span key={s} className={i === step ? "text-coc-gold font-semibold" : ""}>{s}</span>
          ))}
        </div>
        <div className="h-1.5 w-full rounded-full bg-coc-border overflow-hidden">
          <div
            className="h-full rounded-full bg-coc-gold transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-xs text-coc-muted text-right">
          ステップ {step + 1} / {STEPS.length}
        </p>
      </div>

      {/* Error */}
      {errorMsg && (
        <div className="rounded-md border border-red-800 bg-red-950/50 p-3 text-sm text-red-300">
          {errorMsg}
        </div>
      )}

      {/* Step content */}
      <div className="rounded-lg border border-coc-border bg-coc-surface p-5 space-y-4">

        {/* Step 0: 基本情報 */}
        {step === 0 && (
          <>
            <h2 className={sectionTitle}>基本情報</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelClass}>キャラクター名 *</label>
                <input
                  value={state.name}
                  onChange={(e) => dispatch({ type: "SET", field: "name", value: e.target.value })}
                  className={inputClass}
                  placeholder="田中一郎"
                  autoFocus
                />
              </div>
              <div>
                <label className={labelClass}>職業</label>
                <input
                  value={state.occupation}
                  onChange={(e) => dispatch({ type: "SET", field: "occupation", value: e.target.value })}
                  className={inputClass}
                  placeholder="探偵"
                />
              </div>
              <div>
                <label className={labelClass}>年齢</label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={state.age}
                  onChange={(e) => dispatch({ type: "SET", field: "age", value: e.target.value })}
                  className={inputClass}
                  placeholder="28"
                />
              </div>
              <div>
                <label className={labelClass}>性別</label>
                <input
                  value={state.gender}
                  onChange={(e) => dispatch({ type: "SET", field: "gender", value: e.target.value })}
                  className={inputClass}
                  placeholder="男性"
                />
              </div>
              <div>
                <label className={labelClass}>プレイヤー名</label>
                <input
                  value={state.playerName}
                  onChange={(e) => dispatch({ type: "SET", field: "playerName", value: e.target.value })}
                  className={inputClass}
                  placeholder="Yusei"
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>キャッチフレーズ</label>
                <input
                  value={state.catchphrase}
                  onChange={(e) => dispatch({ type: "SET", field: "catchphrase", value: e.target.value })}
                  className={inputClass}
                  placeholder="真実だけが俺の武器"
                />
              </div>
              <div>
                <label className={labelClass}>ルールエディション</label>
                <select
                  value={state.ruleEdition}
                  onChange={(e) => dispatch({ type: "SET", field: "ruleEdition", value: e.target.value as "6th" | "7th" })}
                  className={inputClass}
                >
                  <option value="7th">CoC 7版</option>
                  <option value="6th">CoC 6版</option>
                </select>
              </div>
            </div>
          </>
        )}

        {/* Step 1: 能力値ロール */}
        {step === 1 && (
          <>
            <div className="flex items-center justify-between">
              <h2 className={sectionTitle}>能力値ロール</h2>
              <button
                type="button"
                onClick={() => dispatch({ type: "ROLL_ABILITIES" })}
                className="flex items-center gap-1.5 text-sm text-coc-gold hover:text-coc-text transition-colors"
              >
                <Dices size={16} /> 全てダイスを振る
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <StatInput label="STR" value={state.str} onChange={(v) => dispatch({ type: "SET", field: "str", value: v })} />
              <StatInput label="CON" value={state.con} onChange={(v) => dispatch({ type: "SET", field: "con", value: v })} />
              <StatInput label="POW" value={state.pow} onChange={(v) => dispatch({ type: "SET", field: "pow", value: v })} />
              <StatInput label="DEX" value={state.dex} onChange={(v) => dispatch({ type: "SET", field: "dex", value: v })} />
              <StatInput label="APP" value={state.app} onChange={(v) => dispatch({ type: "SET", field: "app", value: v })} />
              <StatInput label="SIZ" value={state.siz} onChange={(v) => dispatch({ type: "SET", field: "siz", value: v })} />
              <StatInput label="INT" value={state.intStat} onChange={(v) => dispatch({ type: "SET", field: "intStat", value: v })} />
              <StatInput label="EDU" value={state.edu} onChange={(v) => dispatch({ type: "SET", field: "edu", value: v })} />
            </div>
            <div className="rounded-md border border-coc-border bg-coc-void px-3 py-2 text-xs text-coc-muted grid grid-cols-3 gap-2 mt-2">
              <div>HP最大: <span className="text-coc-text font-bold">{hpMax}</span></div>
              <div>MP最大: <span className="text-coc-text font-bold">{mpMax}</span></div>
              <div>初期SAN: <span className="text-coc-text font-bold">{sanStart}</span></div>
              <div>DB: <span className="text-coc-text font-bold">{calcDamageBonus(state.str, state.siz)}</span></div>
              <div>ビルド: <span className="text-coc-text font-bold">{calcBuild(state.str, state.siz)}</span></div>
              <div>MOV: <span className="text-coc-text font-bold">{calcMov(state.str, state.dex, state.siz)}</span></div>
            </div>
            <p className="text-xs text-coc-muted">
              {state.ruleEdition === "6th"
                ? `職業技能ポイント (EDU×20): ${occPoints} ／ 趣味技能ポイント (INT×10): ${personalPoints}`
                : `職業技能ポイント (EDU×4): ${occPoints} ／ 趣味技能ポイント (INT×2): ${personalPoints}`}
            </p>
          </>
        )}

        {/* Step 2: 職業選択 */}
        {step === 2 && (
          <>
            <h2 className={sectionTitle}>職業・技能テンプレート選択</h2>
            <p className="text-xs text-coc-muted">
              職業を選ぶと、次のステップで対応する技能が自動的に読み込まれます。スキップも可能です。
            </p>
            {occupationNames.length > 0 ? (
              <div>
                <label className={labelClass}>職業テンプレート</label>
                <select
                  value={state.selectedOccupation}
                  onChange={(e) => dispatch({ type: "SET", field: "selectedOccupation", value: e.target.value })}
                  className={inputClass}
                >
                  <option value="">スキップ（技能を手動入力）</option>
                  {occupationNames.map((occ) => (
                    <option key={occ} value={occ}>{occ}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="rounded-md border border-coc-border bg-coc-void px-3 py-2 text-xs text-coc-muted">
                {isSupabaseConfigured
                  ? "職業テンプレートがまだ登録されていません。"
                  : "Supabase 未設定のため職業テンプレートを読み込めません。"}
                <Link href="/skill-templates" className="ml-1 text-coc-gold hover:text-coc-text">
                  テンプレート管理へ
                </Link>
              </div>
            )}
          </>
        )}

        {/* Step 3: 技能配分 */}
        {step === 3 && (
          <>
            <div className="flex items-center justify-between">
              <h2 className={sectionTitle}>技能配分</h2>
              <button
                type="button"
                onClick={() => dispatch({ type: "ADD_SKILL" })}
                className="flex items-center gap-1 text-xs text-coc-gold hover:text-coc-text transition-colors"
              >
                <Plus size={14} /> 技能追加
              </button>
            </div>
            <div className="rounded-md border border-coc-border bg-coc-void px-3 py-1.5 text-xs text-coc-muted">
              {state.ruleEdition === "6th"
                ? `職業技能P: ${occPoints} ／ 趣味技能P: ${personalPoints}`
                : `職業技能P (EDU×4): ${occPoints} ／ 趣味技能P (INT×2): ${personalPoints}`}
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_60px_60px_auto_auto] gap-2 text-xs text-coc-muted px-1">
                <span>技能名</span>
                <span className="text-center">基本値</span>
                <span className="text-center">現在値</span>
                <span className="text-center">職業</span>
                <span />
              </div>
              {state.skills.map((skill) => (
                <div key={skill.tempId} className="grid grid-cols-[1fr_60px_60px_auto_auto] gap-2 items-center">
                  <input
                    value={skill.skill_name}
                    onChange={(e) => dispatch({ type: "UPDATE_SKILL", tempId: skill.tempId, field: { skill_name: e.target.value } })}
                    placeholder="技能名"
                    className={inputClass}
                  />
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={skill.base_value}
                    onChange={(e) => dispatch({ type: "UPDATE_SKILL", tempId: skill.tempId, field: { base_value: parseInt(e.target.value) || 0 } })}
                    className={`${inputClass} text-center px-1`}
                  />
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={skill.current_value}
                    onChange={(e) => dispatch({ type: "UPDATE_SKILL", tempId: skill.tempId, field: { current_value: parseInt(e.target.value) || 0 } })}
                    className={`${inputClass} text-center px-1`}
                  />
                  <input
                    type="checkbox"
                    checked={skill.is_occupation}
                    onChange={(e) => dispatch({ type: "UPDATE_SKILL", tempId: skill.tempId, field: { is_occupation: e.target.checked } })}
                    className="w-4 h-4 accent-coc-gold"
                    title="職業技能"
                  />
                  <button
                    type="button"
                    onClick={() => dispatch({ type: "REMOVE_SKILL", tempId: skill.tempId })}
                    className="text-coc-faint hover:text-red-400 transition-colors p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Step 4: 背景・メモ */}
        {step === 4 && (
          <>
            <h2 className={sectionTitle}>背景・メモ</h2>
            <div>
              <label className={labelClass}>背景・経歴</label>
              <textarea
                value={state.background}
                onChange={(e) => dispatch({ type: "SET", field: "background", value: e.target.value })}
                rows={5}
                className={`${inputClass} resize-y font-crimson text-[15px] leading-relaxed`}
                placeholder="キャラクターの来歴、外見、性格などを記述..."
              />
            </div>
            <div>
              <label className={labelClass}>セッションメモ</label>
              <textarea
                value={state.notes}
                onChange={(e) => dispatch({ type: "SET", field: "notes", value: e.target.value })}
                rows={3}
                className={`${inputClass} resize-y font-crimson text-[15px] leading-relaxed`}
                placeholder="セッション中のメモ、発見したアイテム、出会ったNPCなど..."
              />
            </div>
            <div>
              <label className={labelClass}>口調・ロールプレイメモ</label>
              <textarea
                value={state.speechStyle}
                onChange={(e) => dispatch({ type: "SET", field: "speechStyle", value: e.target.value })}
                rows={3}
                className={`${inputClass} resize-y font-crimson text-[15px] leading-relaxed`}
                placeholder="一人称: 俺。語尾に「だぜ」が多い。..."
              />
            </div>
          </>
        )}

        {/* Step 5: 確認・完了 */}
        {step === 5 && (
          <>
            <h2 className={sectionTitle}>確認・完了</h2>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-xs text-coc-muted">キャラクター名</span>
                  <p className="text-coc-text font-medium">{state.name || "—"}</p>
                </div>
                <div>
                  <span className="text-xs text-coc-muted">職業</span>
                  <p className="text-coc-text">{state.occupation || "—"}</p>
                </div>
                <div>
                  <span className="text-xs text-coc-muted">年齢 / 性別</span>
                  <p className="text-coc-text">{state.age || "—"} / {state.gender || "—"}</p>
                </div>
                <div>
                  <span className="text-xs text-coc-muted">プレイヤー</span>
                  <p className="text-coc-text">{state.playerName || "—"}</p>
                </div>
                <div>
                  <span className="text-xs text-coc-muted">ルール版</span>
                  <p className="text-coc-text">{state.ruleEdition === "6th" ? "CoC 6版" : "CoC 7版"}</p>
                </div>
              </div>
              <hr className="border-coc-border" />
              <div className="grid grid-cols-4 gap-2 text-xs">
                {[
                  ["STR", state.str], ["CON", state.con], ["POW", state.pow], ["DEX", state.dex],
                  ["APP", state.app], ["SIZ", state.siz], ["INT", state.intStat], ["EDU", state.edu],
                ].map(([k, v]) => (
                  <div key={k}>
                    <span className="text-coc-muted">{k}</span>
                    <span className="ml-1 text-coc-text font-bold">{v}</span>
                  </div>
                ))}
              </div>
              <div className="text-xs text-coc-muted">
                HP: {hpMax} ／ MP: {mpMax} ／ SAN: {sanStart}
              </div>
              <hr className="border-coc-border" />
              <div>
                <span className="text-xs text-coc-muted">技能数</span>
                <p className="text-coc-text">{state.skills.filter((s) => s.skill_name.trim()).length} 件</p>
              </div>
              {state.background && (
                <div>
                  <span className="text-xs text-coc-muted">背景</span>
                  <p className="text-coc-text text-xs line-clamp-3">{state.background}</p>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-full mt-4 rounded-lg bg-coc-gold-dim border border-coc-gold px-5 py-3 text-sm font-medium text-coc-gold hover:bg-coc-raised transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Check size={16} />
              {saving ? "作成中..." : "キャラクターを作成する"}
            </button>
          </>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-1">
        {step > 0 ? (
          <button
            type="button"
            onClick={back}
            className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
          >
            <ChevronLeft size={16} /> 前へ
          </button>
        ) : (
          <Link href="/characters/new" className="text-sm text-coc-muted hover:text-coc-text transition-colors">
            キャンセル
          </Link>
        )}

        {step < STEPS.length - 1 && (
          <button
            type="button"
            onClick={advance}
            disabled={!canAdvance()}
            className="flex items-center gap-1.5 rounded-lg bg-coc-gold-dim border border-coc-gold px-4 py-2 text-sm font-medium text-coc-gold hover:bg-coc-raised transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            次へ <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
