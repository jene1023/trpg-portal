"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import {
  supabase,
  isSupabaseConfigured,
  CharacterSkill,
  MadnessRecord,
  Scenario,
} from "@/lib/supabase";

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
  { label: "セッションログ", desc: "今回の出来事を記録" },
  { label: "技能成長判定", desc: "成長チェック済み技能を判定" },
  { label: "狂気状態確認", desc: "狂気記録を更新" },
  { label: "次回セッション予定", desc: "次回の日時を設定" },
];

const inputClass =
  "w-full rounded-md border border-coc-border bg-coc-void px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:outline-none focus:border-coc-gold";
const labelClass = "block text-xs text-coc-muted mb-1";

export default function SessionEndPage({ params }: Props) {
  const [characterId, setCharacterId] = useState("");
  const [characterName, setCharacterName] = useState("");
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);

  // Step 0 – session log
  const [sessionForm, setSessionForm] = useState({
    session_number: 1,
    title: "",
    summary: "",
    san_loss: 0,
    hp_loss: 0,
    played_at: "",
  });
  const [sessionSaved, setSessionSaved] = useState(false);
  const [sessionSaving, setSessionSaving] = useState(false);

  // Step 1 – growth roll
  const [growthSkills, setGrowthSkills] = useState<CharacterSkill[]>([]);
  const [sessionLabel, setSessionLabel] = useState("");
  const [growthResults, setGrowthResults] = useState<Record<string, RollResult>>({});

  // Step 2 – madness
  const [madnessRecords, setMadnessRecords] = useState<MadnessRecord[]>([]);

  // Step 3 – next session
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState("");
  const [nextSessionAt, setNextSessionAt] = useState("");
  const [nextSaved, setNextSaved] = useState(false);
  const [nextSaving, setNextSaving] = useState(false);

  useEffect(() => {
    params.then(({ id }) => {
      setCharacterId(id);
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }
      Promise.all([
        supabase.from("characters").select("id, name").eq("id", id).single(),
        supabase
          .from("sessions")
          .select("session_number")
          .eq("character_id", id)
          .order("session_number", { ascending: false })
          .limit(1),
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
          .eq("is_active", true)
          .order("created_at", { ascending: false }),
        supabase
          .from("scenarios")
          .select("*")
          .eq("status", "ongoing")
          .order("title"),
      ]).then(([charRes, sessRes, skillsRes, madnessRes, scenariosRes]) => {
        if (charRes.data) setCharacterName(charRes.data.name);
        const maxNum = (sessRes.data ?? [])[0]?.session_number ?? 0;
        setSessionForm((f) => ({ ...f, session_number: maxNum + 1 }));
        setGrowthSkills(skillsRes.data ?? []);
        setMadnessRecords((madnessRes.data ?? []) as MadnessRecord[]);
        setScenarios((scenariosRes.data ?? []) as Scenario[]);
        setLoading(false);
      });
    });
  }, [params]);

  // sync session title → growth session label
  useEffect(() => {
    if (sessionForm.title) setSessionLabel(sessionForm.title);
  }, [sessionForm.title]);

  async function saveSessionLog() {
    if (!sessionForm.title.trim() || !isSupabaseConfigured) return;
    setSessionSaving(true);
    const { error } = await supabase.from("sessions").insert({
      character_id: characterId,
      session_number: sessionForm.session_number,
      title: sessionForm.title.trim(),
      summary: sessionForm.summary.trim() || null,
      san_loss: sessionForm.san_loss,
      hp_loss: sessionForm.hp_loss,
      played_at: sessionForm.played_at || null,
    });
    if (!error) {
      const { data: charData } = await supabase
        .from("characters")
        .select("hp_current, san_current, luck")
        .eq("id", characterId)
        .single();
      if (charData) {
        await supabase.from("character_stat_snapshots").insert({
          character_id: characterId,
          session_label: sessionForm.title.trim(),
          hp_current: charData.hp_current,
          san_current: charData.san_current,
          luck: charData.luck,
          snapshot_at: new Date().toISOString(),
        });
      }
      setSessionSaved(true);
    }
    setSessionSaving(false);
  }

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

  async function toggleMadness(record: MadnessRecord) {
    if (!isSupabaseConfigured) return;
    const nowIso = new Date().toISOString().slice(0, 10);
    const updates = record.is_active
      ? { is_active: false, recovered_at: nowIso }
      : { is_active: true, recovered_at: null };
    const { error } = await supabase
      .from("madness_records")
      .update(updates)
      .eq("id", record.id);
    if (!error) {
      setMadnessRecords((prev) =>
        prev.map((r) => (r.id === record.id ? { ...r, ...updates } : r))
      );
    }
  }

  async function saveNextSession() {
    if (!selectedScenarioId || !nextSessionAt || !isSupabaseConfigured) return;
    setNextSaving(true);
    const { error } = await supabase
      .from("scenarios")
      .update({ next_session_at: new Date(nextSessionAt).toISOString() })
      .eq("id", selectedScenarioId);
    setNextSaving(false);
    if (!error) setNextSaved(true);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-coc-muted text-sm">読み込み中...</p>
      </div>
    );
  }

  const pendingGrowth = growthSkills.filter((s) => !(s.id in growthResults));
  const doneGrowth = growthSkills.filter((s) => s.id in growthResults);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* breadcrumb */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/characters/${characterId}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          {characterName || "キャラクター詳細"}
        </Link>
      </div>

      <h1 className="font-cinzel text-xl font-bold text-coc-text mb-6">
        セッション終了ウィザード
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

      {/* ── Step 0: session log ── */}
      {step === 0 && (
        <div className="space-y-4">
          <p className="text-xs text-coc-muted">{STEPS[0].desc}</p>

          {sessionSaved ? (
            <div className="rounded-lg border border-green-700 bg-green-950/20 p-4 flex items-center gap-3">
              <Check size={18} className="text-green-400 shrink-0" />
              <p className="text-sm text-green-300">セッションログを記録しました。</p>
            </div>
          ) : (
            <div className="rounded-lg border border-coc-border bg-coc-surface p-4 space-y-3">
              <h2 className="font-cinzel text-sm font-semibold text-coc-gold tracking-widest">
                セッションログ記入
              </h2>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>セッション番号</label>
                  <input
                    type="number"
                    min={1}
                    value={sessionForm.session_number}
                    onChange={(e) =>
                      setSessionForm((f) => ({
                        ...f,
                        session_number: parseInt(e.target.value) || 1,
                      }))
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>プレイ日</label>
                  <input
                    type="date"
                    value={sessionForm.played_at}
                    onChange={(e) =>
                      setSessionForm((f) => ({ ...f, played_at: e.target.value }))
                    }
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>タイトル *</label>
                <input
                  type="text"
                  placeholder="例: 呪われた屋敷の夜"
                  value={sessionForm.title}
                  onChange={(e) =>
                    setSessionForm((f) => ({ ...f, title: e.target.value }))
                  }
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>出来事・サマリー</label>
                <textarea
                  rows={3}
                  placeholder="セッションの概要・重要な出来事など"
                  value={sessionForm.summary}
                  onChange={(e) =>
                    setSessionForm((f) => ({ ...f, summary: e.target.value }))
                  }
                  className={inputClass + " resize-none"}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>SAN喪失量</label>
                  <input
                    type="number"
                    min={0}
                    value={sessionForm.san_loss}
                    onChange={(e) =>
                      setSessionForm((f) => ({
                        ...f,
                        san_loss: parseInt(e.target.value) || 0,
                      }))
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>HP喪失量</label>
                  <input
                    type="number"
                    min={0}
                    value={sessionForm.hp_loss}
                    onChange={(e) =>
                      setSessionForm((f) => ({
                        ...f,
                        hp_loss: parseInt(e.target.value) || 0,
                      }))
                    }
                    className={inputClass}
                  />
                </div>
              </div>

              <button
                onClick={saveSessionLog}
                disabled={sessionSaving || !sessionForm.title.trim()}
                className="w-full rounded-lg bg-coc-gold text-black font-semibold text-sm py-2 disabled:opacity-40 hover:brightness-110 transition-all"
              >
                {sessionSaving ? "保存中…" : "記録する"}
              </button>
            </div>
          )}

          <div className="flex justify-between pt-2">
            <div />
            <button
              onClick={() => setStep(1)}
              className="rounded-lg border border-coc-gold/60 bg-coc-gold/10 px-5 py-2 text-sm font-semibold text-coc-gold hover:bg-coc-gold/20 transition-colors"
            >
              次へ →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 1: growth roll ── */}
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-xs text-coc-muted">{STEPS[1].desc}</p>

          {growthSkills.length === 0 && Object.keys(growthResults).length === 0 ? (
            <div className="rounded-lg border border-coc-border coc-card-bg p-6 text-center">
              <p className="text-coc-muted text-sm">成長チェック済みの技能がありません。</p>
              <p className="text-xs text-coc-muted mt-1">
                スキップして次のステップへ進めます。
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className={labelClass}>
                  セッション名（成長履歴に記録されます）
                </label>
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
                        <p className="text-sm font-semibold text-coc-text">
                          {skill.skill_name}
                        </p>
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
                          <p className="text-sm font-semibold text-coc-text">
                            {skill.skill_name}
                          </p>
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
                          <span>
                            ロール: <span className="text-coc-text font-mono">{r.rolled}</span>
                          </span>
                          <span>
                            判定値: <span className="text-coc-text font-mono">{r.oldValue}</span>
                          </span>
                          {r.success && r.gain !== null && (
                            <>
                              <span>
                                加算:{" "}
                                <span className="text-green-300 font-mono">+{r.gain}</span>
                              </span>
                              <span>
                                新値:{" "}
                                <span className="text-green-300 font-mono font-semibold">
                                  {r.newValue}
                                </span>
                              </span>
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

          {madnessRecords.length === 0 ? (
            <div className="rounded-lg border border-coc-border coc-card-bg p-6 text-center">
              <p className="text-coc-muted text-sm">発症中の狂気はありません。</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-red-400 uppercase tracking-widest">
                発症中 ({madnessRecords.filter((r) => r.is_active).length}件)
              </p>
              {madnessRecords.map((record) => (
                <div
                  key={record.id}
                  className={`rounded-lg border px-4 py-3 space-y-2 ${
                    record.is_active
                      ? "border-red-800 bg-red-950/20"
                      : "border-coc-border bg-coc-surface/50 opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span
                        className={`inline-block rounded border px-1.5 py-0.5 text-xs font-medium ${
                          record.madness_type === "indefinite"
                            ? "text-red-400 border-red-700"
                            : "text-yellow-400 border-yellow-700"
                        }`}
                      >
                        {record.madness_type === "indefinite"
                          ? "不定の狂気"
                          : "一時的狂気"}
                      </span>
                    </div>
                    <button
                      onClick={() => toggleMadness(record)}
                      className={`text-xs shrink-0 transition-colors ${
                        record.is_active
                          ? "text-green-400 hover:text-green-300"
                          : "text-coc-muted hover:text-coc-text"
                      }`}
                    >
                      {record.is_active ? "回復済みにする" : "再発症"}
                    </button>
                  </div>
                  <p className="text-sm text-coc-text leading-relaxed whitespace-pre-wrap">
                    {record.symptom}
                  </p>
                  {record.started_at && (
                    <p className="text-xs text-coc-muted">発症: {record.started_at}</p>
                  )}
                </div>
              ))}
            </div>
          )}

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

      {/* ── Step 3: next session ── */}
      {step === 3 && (
        <div className="space-y-4">
          <p className="text-xs text-coc-muted">{STEPS[3].desc}</p>

          {nextSaved ? (
            <div className="rounded-lg border border-green-700 bg-green-950/20 p-4 flex items-center gap-3">
              <Check size={18} className="text-green-400 shrink-0" />
              <p className="text-sm text-green-300">次回セッション予定を設定しました。</p>
            </div>
          ) : scenarios.length === 0 ? (
            <div className="rounded-lg border border-coc-border coc-card-bg p-6 text-center">
              <p className="text-coc-muted text-sm">進行中のシナリオがありません。</p>
              <p className="text-xs text-coc-muted mt-1">
                シナリオ管理ページで次回予定を設定できます。
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-coc-border bg-coc-surface p-4 space-y-3">
              <h2 className="font-cinzel text-sm font-semibold text-coc-gold tracking-widest">
                次回セッション日時
              </h2>

              <div>
                <label className={labelClass}>シナリオ</label>
                <select
                  value={selectedScenarioId}
                  onChange={(e) => setSelectedScenarioId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">シナリオを選択...</option>
                  {scenarios.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>次回予定日時</label>
                <input
                  type="datetime-local"
                  value={nextSessionAt}
                  onChange={(e) => setNextSessionAt(e.target.value)}
                  className={inputClass}
                />
              </div>

              <button
                onClick={saveNextSession}
                disabled={nextSaving || !selectedScenarioId || !nextSessionAt}
                className="w-full rounded-lg bg-coc-gold text-black font-semibold text-sm py-2 disabled:opacity-40 hover:brightness-110 transition-all"
              >
                {nextSaving ? "保存中…" : "次回予定を設定する"}
              </button>
            </div>
          )}

          <div className="flex justify-between pt-2">
            <button
              onClick={() => setStep(2)}
              className="rounded-lg border border-coc-border px-5 py-2 text-sm text-coc-muted hover:text-coc-text transition-colors"
            >
              ← 戻る
            </button>
            <Link
              href={`/characters/${characterId}`}
              className="rounded-lg border border-coc-gold/60 bg-coc-gold/10 px-5 py-2 text-sm font-semibold text-coc-gold hover:bg-coc-gold/20 transition-colors"
            >
              完了 — キャラクター詳細へ
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
