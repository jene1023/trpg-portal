"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import {
  supabase,
  isSupabaseConfigured,
  CharacterSkill,
  MadnessRecord,
  Character,
  SessionLog,
} from "@/lib/supabase";
import QuickStatEditor from "@/app/_components/QuickStatEditor";
import MadnessList from "@/app/_components/MadnessList";
import SessionLogForm from "@/app/_components/SessionLogForm";

type RollResult = {
  skillId: string;
  rolled: number;
  success: boolean;
  gain: number | null;
  oldValue: number;
  newValue: number;
};

type Props = { params: Promise<{ id: string }> };

const STEPS = [
  { label: "成長チェック", desc: "成長チェック済みの技能を確認・判定" },
  { label: "HP/SAN/MP更新", desc: "現在値を最新の状態に更新" },
  { label: "狂気記録", desc: "狂気症状の確認・追加" },
  { label: "セッションログ", desc: "今回の出来事を記録" },
];

export default function PostSessionPage({ params }: Props) {
  const router = useRouter();
  const [characterId, setCharacterId] = useState("");
  const [character, setCharacter] = useState<Character | null>(null);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);

  // Step 0 – growth
  const [growthSkills, setGrowthSkills] = useState<CharacterSkill[]>([]);
  const [sessionLabel, setSessionLabel] = useState("");
  const [growthResults, setGrowthResults] = useState<Record<string, RollResult>>({});

  // Step 2 – madness
  const [madnessRecords, setMadnessRecords] = useState<MadnessRecord[]>([]);

  // Step 3 – session log
  const [nextSessionNumber, setNextSessionNumber] = useState(1);
  const [sessionLogAdded, setSessionLogAdded] = useState(false);

  useEffect(() => {
    params.then(({ id }) => {
      setCharacterId(id);
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }
      Promise.all([
        supabase.from("characters").select("*").eq("id", id).single(),
        supabase
          .from("character_skills")
          .select("*")
          .eq("character_id", id)
          .eq("growth_checked", true)
          .order("skill_name"),
        supabase
          .from("madness_records")
          .select("*")
          .eq("character_id", id)
          .order("created_at", { ascending: false }),
        supabase
          .from("sessions")
          .select("session_number")
          .eq("character_id", id)
          .order("session_number", { ascending: false })
          .limit(1),
      ]).then(([charRes, skillsRes, madnessRes, sessRes]) => {
        if (charRes.data) setCharacter(charRes.data as Character);
        setGrowthSkills(skillsRes.data ?? []);
        setMadnessRecords((madnessRes.data ?? []) as MadnessRecord[]);
        const maxNum = (sessRes.data ?? [])[0]?.session_number ?? 0;
        setNextSessionNumber(maxNum + 1);
        setLoading(false);
      });
    });
  }, [params]);

  async function rollGrowth(skill: CharacterSkill) {
    const rolled = Math.floor(Math.random() * 100) + 1;
    const success = rolled > skill.current_value;
    const gain = success ? Math.floor(Math.random() * 10) + 1 : null;
    const newValue = success ? skill.current_value + gain! : skill.current_value;
    const oldValue = skill.current_value;

    if (isSupabaseConfigured) {
      await supabase
        .from("character_skills")
        .update({ current_value: newValue, growth_checked: false })
        .eq("id", skill.id);
      if (success) {
        await supabase.from("growth_history").insert({
          character_id: characterId,
          skill_name: skill.skill_name,
          old_value: oldValue,
          new_value: newValue,
          session_label: sessionLabel || null,
          grown_at: new Date().toISOString(),
        });
      }
    }

    setGrowthResults((prev) => ({
      ...prev,
      [skill.id]: { skillId: skill.id, rolled, success, gain, oldValue, newValue },
    }));
    setGrowthSkills((prev) =>
      prev.map((s) =>
        s.id === skill.id ? { ...s, current_value: newValue, growth_checked: false } : s
      )
    );
  }

  function handleSessionLogAdded(log: SessionLog) {
    setSessionLogAdded(true);
    setTimeout(() => {
      setCompleted(true);
    }, 800);
    void log;
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-coc-muted text-sm">読み込み中...</p>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="rounded-lg border border-green-700 bg-green-950/20 p-8 text-center space-y-4">
          <div className="flex justify-center">
            <span className="w-14 h-14 rounded-full border-2 border-green-600 bg-green-950/40 flex items-center justify-center">
              <Check size={28} className="text-green-400" />
            </span>
          </div>
          <h2 className="font-cinzel text-lg font-bold text-green-300">記録完了</h2>
          <p className="text-sm text-coc-muted">
            セッション後の記録がすべて完了しました。
          </p>
          <Link
            href={`/characters/${characterId}`}
            className="inline-block mt-2 rounded-lg border border-coc-gold/60 bg-coc-gold/10 px-6 py-2.5 text-sm font-semibold text-coc-gold hover:bg-coc-gold/20 transition-colors"
          >
            キャラクター詳細へ →
          </Link>
        </div>
      </div>
    );
  }

  const pendingGrowth = growthSkills.filter((s) => !(s.id in growthResults));
  const doneGrowth = growthSkills.filter((s) => s.id in growthResults);

  const inputClass =
    "w-full rounded-md border border-coc-border bg-coc-void px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:outline-none focus:border-coc-gold";
  const labelClass = "block text-xs text-coc-muted mb-1";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* breadcrumb */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/characters/${characterId}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          {character?.name || "キャラクター詳細"}
        </Link>
      </div>

      <h1 className="font-cinzel text-xl font-bold text-coc-text mb-6">
        ポストセッション記録
      </h1>

      {/* step indicator */}
      <div className="flex items-center gap-0 mb-8 overflow-x-auto">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center min-w-0">
            <button
              onClick={() => setStep(i)}
              className={`flex flex-col items-center px-2 py-1 rounded transition-colors ${
                i === step
                  ? "text-coc-gold"
                  : i < step
                  ? "text-green-400"
                  : "text-coc-muted"
              }`}
            >
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${
                  i === step
                    ? "border-coc-gold bg-coc-gold/10"
                    : i < step
                    ? "border-green-600 bg-green-950/40"
                    : "border-coc-border bg-coc-surface"
                }`}
              >
                {i < step ? <Check size={12} /> : i + 1}
              </span>
              <span className="text-[10px] mt-0.5 whitespace-nowrap">{s.label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div
                className={`h-px w-4 shrink-0 ${
                  i < step ? "bg-green-700" : "bg-coc-border"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* ── Step 0: growth check ── */}
      {step === 0 && (
        <div className="space-y-4">
          <p className="text-xs text-coc-muted">{STEPS[0].desc}</p>

          {growthSkills.length === 0 && Object.keys(growthResults).length === 0 ? (
            <div className="rounded-lg border border-coc-border coc-card-bg p-6 text-center">
              <p className="text-coc-muted text-sm">成長チェック済みの技能がありません。</p>
              <p className="text-xs text-coc-muted mt-1">スキップして次のステップへ進めます。</p>
            </div>
          ) : (
            <>
              <div>
                <label className={labelClass}>セッション名（成長履歴に記録されます）</label>
                <input
                  type="text"
                  value={sessionLabel}
                  onChange={(e) => setSessionLabel(e.target.value)}
                  placeholder="例: 第3回「忌まわしき屋敷」"
                  className={inputClass}
                />
              </div>

              {pendingGrowth.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-coc-muted uppercase tracking-widest">
                    判定待ち ({pendingGrowth.length}件)
                  </p>
                  {pendingGrowth.map((skill) => (
                    <div
                      key={skill.id}
                      className="flex items-center justify-between rounded-lg border border-coc-border coc-card-bg px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-coc-text">{skill.skill_name}</p>
                        <p className="text-xs text-coc-muted">現在値: {skill.current_value}</p>
                      </div>
                      <button
                        onClick={() => rollGrowth(skill)}
                        className="rounded-lg border border-coc-gold/60 bg-coc-gold/10 px-4 py-1.5 text-sm font-semibold text-coc-gold hover:bg-coc-gold/20 transition-colors"
                      >
                        成長ロール
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {doneGrowth.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-coc-muted uppercase tracking-widest">
                    判定済み ({doneGrowth.length}件)
                  </p>
                  {doneGrowth.map((skill) => {
                    const r = growthResults[skill.id];
                    return (
                      <div
                        key={skill.id}
                        className={`rounded-lg border px-4 py-3 ${
                          r.success
                            ? "border-green-700/60 bg-green-950/20"
                            : "border-coc-border bg-coc-surface/50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-coc-text">{skill.skill_name}</p>
                          {r.success ? (
                            <span className="rounded bg-green-900/60 border border-green-700 px-2 py-0.5 text-xs font-semibold text-green-300">
                              成長！
                            </span>
                          ) : (
                            <span className="rounded bg-coc-raised border border-coc-border px-2 py-0.5 text-xs text-coc-muted">
                              変化なし
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-3 text-xs text-coc-muted">
                          <span>ロール: <span className="text-coc-text font-mono">{r.rolled}</span></span>
                          <span>判定値: <span className="text-coc-text font-mono">{r.oldValue}</span></span>
                          {r.success && r.gain !== null && (
                            <>
                              <span>加算: <span className="text-green-300 font-mono">+{r.gain}</span></span>
                              <span>新値: <span className="text-green-300 font-mono font-semibold">{r.newValue}</span></span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setStep(1)}
              className="rounded-lg border border-coc-gold/60 bg-coc-gold/10 px-5 py-2 text-sm font-semibold text-coc-gold hover:bg-coc-gold/20 transition-colors"
            >
              次へ →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 1: HP/SAN/MP ── */}
      {step === 1 && character && (
        <div className="space-y-4">
          <p className="text-xs text-coc-muted">{STEPS[1].desc}</p>

          <div className="rounded-lg border border-coc-border bg-coc-surface p-4 space-y-3">
            <h2 className="font-cinzel text-sm font-semibold text-coc-gold tracking-widest">
              現在値を更新
            </h2>
            <QuickStatEditor
              characterId={characterId}
              hpCurrent={character.hp_current}
              hpMax={character.hp_max}
              mpCurrent={character.mp_current}
              mpMax={character.mp_max}
              sanCurrent={character.san_current}
              sanMax={character.san_max}
              con={character.con}
            />
          </div>

          <div className="flex justify-between pt-2">
            <button
              onClick={() => setStep(0)}
              className="rounded-lg border border-coc-border px-5 py-2 text-sm text-coc-muted hover:text-coc-text transition-colors"
            >
              ← 戻る
            </button>
            <button
              onClick={() => setStep(2)}
              className="rounded-lg border border-coc-gold/60 bg-coc-gold/10 px-5 py-2 text-sm font-semibold text-coc-gold hover:bg-coc-gold/20 transition-colors"
            >
              次へ →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: madness ── */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-xs text-coc-muted">{STEPS[2].desc}</p>

          <div className="rounded-lg border border-coc-border bg-coc-surface p-4">
            <h2 className="font-cinzel text-sm font-semibold text-coc-gold tracking-widest mb-4">
              狂気記録
            </h2>
            <MadnessList characterId={characterId} initialRecords={madnessRecords} />
          </div>

          <div className="flex justify-between pt-2">
            <button
              onClick={() => setStep(1)}
              className="rounded-lg border border-coc-border px-5 py-2 text-sm text-coc-muted hover:text-coc-text transition-colors"
            >
              ← 戻る
            </button>
            <button
              onClick={() => setStep(3)}
              className="rounded-lg border border-coc-gold/60 bg-coc-gold/10 px-5 py-2 text-sm font-semibold text-coc-gold hover:bg-coc-gold/20 transition-colors"
            >
              次へ →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: session log ── */}
      {step === 3 && (
        <div className="space-y-4">
          <p className="text-xs text-coc-muted">{STEPS[3].desc}</p>

          {sessionLogAdded ? (
            <div className="rounded-lg border border-green-700 bg-green-950/20 p-4 flex items-center gap-3">
              <Check size={18} className="text-green-400 shrink-0" />
              <p className="text-sm text-green-300">セッションログを記録しました。</p>
            </div>
          ) : (
            <div className="rounded-lg border border-coc-border bg-coc-surface p-4">
              <h2 className="font-cinzel text-sm font-semibold text-coc-gold tracking-widest mb-4">
                セッションログ
              </h2>
              <SessionLogForm
                characterId={characterId}
                nextSessionNumber={nextSessionNumber}
                onAdded={handleSessionLogAdded}
                characterName={character?.name}
              />
            </div>
          )}

          <div className="flex justify-between pt-2">
            <button
              onClick={() => setStep(2)}
              className="rounded-lg border border-coc-border px-5 py-2 text-sm text-coc-muted hover:text-coc-text transition-colors"
            >
              ← 戻る
            </button>
            <button
              onClick={() => setCompleted(true)}
              className="rounded-lg border border-coc-gold/60 bg-coc-gold/10 px-5 py-2 text-sm font-semibold text-coc-gold hover:bg-coc-gold/20 transition-colors"
            >
              完了 →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
