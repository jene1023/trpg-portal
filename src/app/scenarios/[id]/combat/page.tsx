"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Swords,
  RotateCcw,
  Plus,
  Minus,
  Trash2,
  Bug,
  Skull,
  Layers,
  Radio,
  X,
} from "lucide-react";
import {
  supabase,
  isSupabaseConfigured,
  Character,
  ScenarioParticipant,
  Creature,
  EncounterTemplateWithEntries,
} from "@/lib/supabase";

type CombatEntry = {
  id: string;
  scenario_id: string;
  entry_name: string;
  is_npc: boolean;
  dex: number;
  hp_max: number;
  hp_current: number;
  mp_current: number;
  conditions: string[];
  is_defeated: boolean;
  sort_order: number;
  created_at: string;
};

type ParticipantWithCharacter = ScenarioParticipant & {
  characters: Pick<Character, "id" | "name" | "dex" | "hp_current" | "hp_max" | "mp_current">;
};

type CreatureRow = Pick<Creature, "id" | "name" | "hp" | "dex">;

const PRESET_CONDITIONS = ["毒", "燃焼", "麻痺", "恐怖", "狂気", "拘束", "負傷", "疲労"];

export default function CombatPage() {
  const params = useParams<{ id: string }>();
  const scenarioId = params.id;

  const [scenarioTitle, setScenarioTitle] = useState("");
  const [entries, setEntries] = useState<CombatEntry[]>([]);
  const [creatures, setCreatures] = useState<CreatureRow[]>([]);
  const [templates, setTemplates] = useState<EncounterTemplateWithEntries[]>([]);
  const [round, setRound] = useState(1);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const [newName, setNewName] = useState("");
  const [newDex, setNewDex] = useState("");
  const [newHp, setNewHp] = useState("");
  const [newMp, setNewMp] = useState("0");

  const [directHpInputs, setDirectHpInputs] = useState<Record<string, string>>({});
  const [conditionInputs, setConditionInputs] = useState<Record<string, string>>({});

  const sorted = [...entries].sort((a, b) => {
    if (a.is_defeated !== b.is_defeated) return a.is_defeated ? 1 : -1;
    return b.dex - a.dex;
  });

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    async function reload() {
      const { data } = await supabase
        .from("combat_entries")
        .select("*")
        .eq("scenario_id", scenarioId)
        .order("dex", { ascending: false });
      setEntries((data ?? []) as CombatEntry[]);
    }

    async function loadAll() {
      const [
        { data: scenario },
        { data: participants },
        { data: creatureData },
        { data: tplData },
        { data: existing },
      ] = await Promise.all([
        supabase.from("scenarios").select("title").eq("id", scenarioId).single(),
        supabase
          .from("scenario_participants")
          .select("*, characters(id, name, dex, hp_current, hp_max, mp_current)")
          .eq("scenario_id", scenarioId),
        supabase.from("creatures").select("id, name, hp, dex").eq("scenario_id", scenarioId),
        supabase
          .from("encounter_templates")
          .select("*, encounter_template_entries(*, creatures(id, name, hp, dex))")
          .order("created_at", { ascending: false }),
        supabase.from("combat_entries").select("*").eq("scenario_id", scenarioId),
      ]);

      setScenarioTitle(scenario?.title ?? "");
      setCreatures(((creatureData ?? []) as CreatureRow[]).filter((c) => c.hp !== null));
      setTemplates((tplData ?? []) as EncounterTemplateWithEntries[]);

      if ((existing ?? []).length === 0 && (participants ?? []).length > 0) {
        const list = (participants ?? []) as ParticipantWithCharacter[];
        const toInsert = list.map((p, i) => ({
          scenario_id: scenarioId,
          entry_name: p.characters.name,
          is_npc: false,
          dex: p.characters.dex,
          hp_max: p.characters.hp_max,
          hp_current: p.characters.hp_current,
          mp_current: p.characters.mp_current,
          conditions: [],
          is_defeated: false,
          sort_order: i,
        }));
        await supabase.from("combat_entries").insert(toInsert);
        await reload();
      } else {
        setEntries((existing ?? []) as CombatEntry[]);
      }

      setLoading(false);
    }

    loadAll();

    const channel = supabase
      .channel(`combat-${scenarioId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "combat_entries",
          filter: `scenario_id=eq.${scenarioId}`,
        },
        reload
      )
      .subscribe((status: string) => {
        setConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
      setConnected(false);
    };
  }, [scenarioId]);

  async function addEnemy() {
    const dexNum = parseInt(newDex, 10) || 0;
    const hpNum = parseInt(newHp, 10);
    const mpNum = parseInt(newMp, 10) || 0;
    if (!newName.trim() || isNaN(hpNum) || hpNum <= 0) return;
    if (!isSupabaseConfigured) return;

    await supabase.from("combat_entries").insert({
      scenario_id: scenarioId,
      entry_name: newName.trim(),
      is_npc: true,
      dex: dexNum,
      hp_max: hpNum,
      hp_current: hpNum,
      mp_current: mpNum,
      conditions: [],
      is_defeated: false,
      sort_order: entries.length,
    });
    setNewName("");
    setNewDex("");
    setNewHp("");
    setNewMp("0");
  }

  async function addCreatureAsEnemy(creature: CreatureRow) {
    if (!creature.hp || !isSupabaseConfigured) return;
    await supabase.from("combat_entries").insert({
      scenario_id: scenarioId,
      entry_name: creature.name,
      is_npc: true,
      dex: creature.dex ?? 0,
      hp_max: creature.hp,
      hp_current: creature.hp,
      mp_current: 0,
      conditions: [],
      is_defeated: false,
      sort_order: entries.length,
    });
  }

  async function addFromTemplate(tpl: EncounterTemplateWithEntries) {
    if (!isSupabaseConfigured) return;
    const toInsert = [];
    let sortBase = entries.length;
    for (const entry of tpl.encounter_template_entries) {
      if (!entry.creatures.hp) continue;
      for (let i = 0; i < entry.count; i++) {
        toInsert.push({
          scenario_id: scenarioId,
          entry_name:
            entry.count > 1 ? `${entry.creatures.name} ${i + 1}` : entry.creatures.name,
          is_npc: true,
          dex: entry.creatures.dex ?? 0,
          hp_max: entry.creatures.hp,
          hp_current: entry.creatures.hp,
          mp_current: 0,
          conditions: [],
          is_defeated: false,
          sort_order: sortBase++,
        });
      }
    }
    if (toInsert.length > 0) {
      await supabase.from("combat_entries").insert(toInsert);
    }
  }

  async function adjustHp(entry: CombatEntry, delta: number) {
    if (!isSupabaseConfigured) return;
    const newVal = Math.max(0, Math.min(entry.hp_max, entry.hp_current + delta));
    setEntries((prev) =>
      prev.map((e) => (e.id === entry.id ? { ...e, hp_current: newVal } : e))
    );
    await supabase.from("combat_entries").update({ hp_current: newVal }).eq("id", entry.id);
  }

  async function setHpDirect(entry: CombatEntry, value: string) {
    if (!isSupabaseConfigured) return;
    const num = parseInt(value, 10);
    if (isNaN(num)) return;
    const newVal = Math.max(0, Math.min(entry.hp_max, num));
    setEntries((prev) =>
      prev.map((e) => (e.id === entry.id ? { ...e, hp_current: newVal } : e))
    );
    await supabase.from("combat_entries").update({ hp_current: newVal }).eq("id", entry.id);
  }

  async function adjustMp(entry: CombatEntry, delta: number) {
    if (!isSupabaseConfigured) return;
    const newVal = Math.max(0, entry.mp_current + delta);
    setEntries((prev) =>
      prev.map((e) => (e.id === entry.id ? { ...e, mp_current: newVal } : e))
    );
    await supabase.from("combat_entries").update({ mp_current: newVal }).eq("id", entry.id);
  }

  async function toggleDefeated(entry: CombatEntry) {
    if (!isSupabaseConfigured) return;
    const newVal = !entry.is_defeated;
    setEntries((prev) =>
      prev.map((e) => (e.id === entry.id ? { ...e, is_defeated: newVal } : e))
    );
    await supabase.from("combat_entries").update({ is_defeated: newVal }).eq("id", entry.id);
  }

  async function addCondition(entry: CombatEntry, condition: string) {
    const trimmed = condition.trim();
    if (!trimmed || entry.conditions.includes(trimmed) || !isSupabaseConfigured) return;
    const newConditions = [...entry.conditions, trimmed];
    setEntries((prev) =>
      prev.map((e) => (e.id === entry.id ? { ...e, conditions: newConditions } : e))
    );
    await supabase
      .from("combat_entries")
      .update({ conditions: newConditions })
      .eq("id", entry.id);
    setConditionInputs((prev) => ({ ...prev, [entry.id]: "" }));
  }

  async function removeCondition(entry: CombatEntry, condition: string) {
    if (!isSupabaseConfigured) return;
    const newConditions = entry.conditions.filter((c) => c !== condition);
    setEntries((prev) =>
      prev.map((e) => (e.id === entry.id ? { ...e, conditions: newConditions } : e))
    );
    await supabase
      .from("combat_entries")
      .update({ conditions: newConditions })
      .eq("id", entry.id);
  }

  async function removeEntry(id: string) {
    if (!isSupabaseConfigured) return;
    setEntries((prev) => prev.filter((e) => e.id !== id));
    await supabase.from("combat_entries").delete().eq("id", id);
  }

  async function resetCombat() {
    if (!isSupabaseConfigured) return;
    if (!confirm("戦闘データをリセットしますか？全エントリが削除されます。")) return;
    await supabase.from("combat_entries").delete().eq("scenario_id", scenarioId);
    setEntries([]);
    setRound(1);
  }

  function hpColor(current: number, max: number) {
    const pct = max > 0 ? current / max : 0;
    if (pct <= 0) return "text-coc-muted";
    if (pct <= 0.25) return "text-red-400";
    if (pct <= 0.5) return "text-yellow-400";
    return "text-green-400";
  }

  function hpBarColor(pct: number) {
    if (pct <= 0) return "bg-coc-muted";
    if (pct <= 25) return "bg-red-500";
    if (pct <= 50) return "bg-yellow-500";
    return "bg-green-500";
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-sm text-coc-muted">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between gap-3 mb-6">
        <Link
          href={`/scenarios/${scenarioId}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          シナリオ詳細
        </Link>
        {isSupabaseConfigured && (
          <span
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
              connected
                ? "border-green-700 bg-green-900/20 text-green-400"
                : "border-coc-border text-coc-muted"
            }`}
          >
            <Radio size={11} className={connected ? "animate-pulse" : ""} />
            {connected ? "同期中" : "接続中…"}
          </span>
        )}
      </div>

      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs text-coc-muted mb-1">{scenarioTitle}</p>
          <h1 className="font-cinzel text-xl font-bold text-coc-text flex items-center gap-2">
            <Swords size={20} className="text-coc-gold" />
            戦闘イニシアチブトラッカー
          </h1>
          <p className="text-xs text-coc-muted mt-1">
            DEX順・HP/MP管理・コンディション追跡（リアルタイム同期）
          </p>
        </div>
        <button
          onClick={resetCombat}
          className="flex items-center gap-1.5 rounded-lg border border-coc-border px-3 py-1.5 text-xs text-coc-muted hover:text-red-400 hover:border-red-800 transition-colors"
        >
          <RotateCcw size={14} />
          リセット
        </button>
      </div>

      {/* Round counter */}
      <div className="mb-6 rounded-xl border border-coc-gold-dim bg-coc-surface px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-coc-muted mb-1">現在ラウンド</p>
          <p className="text-4xl font-bold text-coc-gold tabular-nums">{round}</p>
        </div>
        <button
          onClick={() => setRound((r) => r + 1)}
          className="flex items-center gap-1.5 rounded-lg border border-coc-gold bg-coc-gold/10 px-4 py-2 text-sm font-medium text-coc-gold hover:bg-coc-gold/20 transition-colors"
        >
          次のラウンド ({round + 1})
        </button>
      </div>

      {/* Creature quick-add */}
      {creatures.length > 0 && (
        <div className="mb-4 rounded-xl border border-coc-border bg-coc-surface px-4 py-3">
          <p className="text-xs font-medium text-coc-muted mb-2 flex items-center gap-1.5">
            <Bug size={13} />
            このシナリオのクリーチャーから追加
          </p>
          <div className="flex flex-wrap gap-2">
            {creatures.map((c) => (
              <button
                key={c.id}
                onClick={() => addCreatureAsEnemy(c)}
                className="rounded-full border border-coc-border bg-coc-raised px-3 py-1 text-xs text-coc-text hover:border-coc-gold hover:text-coc-gold transition-colors"
              >
                {c.name}
                {c.dex !== null && (
                  <span className="ml-1 text-coc-muted">DEX{c.dex}</span>
                )}
                {c.hp !== null && (
                  <span className="ml-1 text-coc-muted">HP{c.hp}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Template quick-add */}
      {templates.length > 0 && (
        <div className="mb-4 rounded-xl border border-coc-border bg-coc-surface px-4 py-3">
          <p className="text-xs font-medium text-coc-muted mb-2 flex items-center gap-1.5">
            <Layers size={13} />
            テンプレートから一括追加
          </p>
          <div className="flex flex-wrap gap-2">
            {templates.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => addFromTemplate(tpl)}
                className="rounded-full border border-coc-border bg-coc-raised px-3 py-1 text-xs text-coc-text hover:border-coc-gold hover:text-coc-gold transition-colors"
              >
                {tpl.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add enemy form */}
      <div className="mb-6 rounded-xl border border-coc-border bg-coc-surface px-4 py-4">
        <p className="text-xs font-medium text-coc-muted mb-3 flex items-center gap-1.5">
          <Skull size={13} />
          NPC/敵を追加
        </p>
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            placeholder="名前"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addEnemy()}
            className="flex-1 min-w-[110px] rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:outline-none focus:border-coc-gold"
          />
          <input
            type="number"
            placeholder="DEX"
            value={newDex}
            onChange={(e) => setNewDex(e.target.value)}
            className="w-18 rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:outline-none focus:border-coc-gold"
          />
          <input
            type="number"
            placeholder="最大HP"
            value={newHp}
            onChange={(e) => setNewHp(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addEnemy()}
            className="w-22 rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:outline-none focus:border-coc-gold"
          />
          <input
            type="number"
            placeholder="MP"
            value={newMp}
            onChange={(e) => setNewMp(e.target.value)}
            className="w-16 rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:outline-none focus:border-coc-gold"
          />
          <button
            onClick={addEnemy}
            disabled={!newName.trim() || !newHp}
            className="flex items-center gap-1 rounded-lg border border-coc-gold bg-coc-gold/10 px-3 py-2 text-sm text-coc-gold hover:bg-coc-gold/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus size={15} />
            追加
          </button>
        </div>
      </div>

      {/* Initiative list */}
      {sorted.length === 0 ? (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-8 text-center">
          <p className="text-coc-muted text-sm">参加者がいません。</p>
          <Link
            href={`/scenarios/${scenarioId}/participants`}
            className="mt-3 inline-block text-xs text-coc-gold hover:underline"
          >
            参加キャラクターを追加 →
          </Link>
        </div>
      ) : (
        <>
          <p className="text-xs text-coc-muted mb-3">DEX順イニシアチブ（高い順）</p>
          <div className="flex flex-col gap-3 mb-6">
            {sorted.map((entry, index) => {
              const hpPct = entry.hp_max > 0 ? (entry.hp_current / entry.hp_max) * 100 : 0;

              return (
                <div
                  key={entry.id}
                  className={`rounded-xl border px-4 py-3 transition-colors ${
                    entry.is_defeated
                      ? "border-coc-border bg-coc-raised opacity-60"
                      : "border-coc-border bg-coc-surface"
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-coc-border text-xs text-coc-muted">
                        {index + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p
                            className={`font-medium ${
                              entry.is_defeated
                                ? "text-coc-muted line-through"
                                : "text-coc-text"
                            }`}
                          >
                            {entry.entry_name}
                          </p>
                          <span
                            className={`rounded-full border px-1.5 py-0.5 text-xs ${
                              entry.is_npc
                                ? "border-red-800 text-red-400"
                                : "border-blue-800 text-blue-400"
                            }`}
                          >
                            {entry.is_npc ? "NPC" : "PC"}
                          </span>
                        </div>
                        <p className="text-xs text-coc-muted">DEX {entry.dex}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => toggleDefeated(entry)}
                        className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                          entry.is_defeated
                            ? "border-red-800 text-red-400"
                            : "border-coc-border text-coc-muted hover:border-coc-gold"
                        }`}
                      >
                        {entry.is_defeated ? "撃破" : "戦闘中"}
                      </button>
                      {entry.is_npc && (
                        <button
                          onClick={() => removeEntry(entry.id)}
                          className="text-coc-muted hover:text-red-400 transition-colors"
                          aria-label="削除"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Condition badges */}
                  <div className="mb-3">
                    {entry.conditions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {entry.conditions.map((cond) => (
                          <span
                            key={cond}
                            className="flex items-center gap-1 rounded-full border border-yellow-800 bg-yellow-950/30 px-2 py-0.5 text-xs text-yellow-400"
                          >
                            {cond}
                            <button
                              onClick={() => removeCondition(entry, cond)}
                              className="hover:text-red-400 transition-colors"
                              aria-label="コンディション削除"
                            >
                              <X size={10} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {PRESET_CONDITIONS.filter((c) => !entry.conditions.includes(c)).map((c) => (
                        <button
                          key={c}
                          onClick={() => addCondition(entry, c)}
                          className="rounded-full border border-coc-border px-2 py-0.5 text-xs text-coc-muted hover:border-yellow-700 hover:text-yellow-400 transition-colors"
                        >
                          +{c}
                        </button>
                      ))}
                      <input
                        type="text"
                        placeholder="カスタム…"
                        value={conditionInputs[entry.id] ?? ""}
                        onChange={(e) =>
                          setConditionInputs((prev) => ({
                            ...prev,
                            [entry.id]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            addCondition(entry, conditionInputs[entry.id] ?? "");
                          }
                        }}
                        className="w-24 rounded-lg border border-coc-border bg-coc-raised px-2 py-0.5 text-xs text-coc-text placeholder:text-coc-muted focus:outline-none focus:border-coc-gold"
                      />
                    </div>
                  </div>

                  {/* HP section */}
                  <div className="mb-2">
                    <div className="flex items-end justify-between mb-1">
                      <span className="text-xs text-coc-muted">HP</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min={0}
                          max={entry.hp_max}
                          value={directHpInputs[entry.id] ?? entry.hp_current}
                          onChange={(e) =>
                            setDirectHpInputs((prev) => ({
                              ...prev,
                              [entry.id]: e.target.value,
                            }))
                          }
                          onBlur={(e) => {
                            setHpDirect(entry, e.target.value);
                            setDirectHpInputs((prev) => {
                              const next = { ...prev };
                              delete next[entry.id];
                              return next;
                            });
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const val = (e.target as HTMLInputElement).value;
                              setHpDirect(entry, val);
                              setDirectHpInputs((prev) => {
                                const next = { ...prev };
                                delete next[entry.id];
                                return next;
                              });
                            }
                          }}
                          className={`w-14 rounded border border-coc-border bg-coc-raised px-2 py-0.5 text-right text-sm font-bold tabular-nums focus:outline-none focus:border-coc-gold ${hpColor(entry.hp_current, entry.hp_max)}`}
                        />
                        <span className="text-sm text-coc-muted">/{entry.hp_max}</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-coc-raised overflow-hidden mb-2">
                      <div
                        className={`h-full rounded-full transition-all ${hpBarColor(hpPct)}`}
                        style={{ width: `${hpPct}%` }}
                      />
                    </div>
                    <div className="flex gap-1.5">
                      {[-5, -3, -1].map((delta) => (
                        <button
                          key={delta}
                          onClick={() => adjustHp(entry, delta)}
                          disabled={entry.is_defeated || entry.hp_current <= 0}
                          className="flex-1 flex items-center justify-center gap-0.5 rounded border border-red-900 bg-red-950/20 py-1 text-xs text-red-400 hover:bg-red-950/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Minus size={10} />
                          {Math.abs(delta)}
                        </button>
                      ))}
                      <div className="w-px bg-coc-border" />
                      {[1, 3, 5].map((delta) => (
                        <button
                          key={delta}
                          onClick={() => adjustHp(entry, delta)}
                          disabled={entry.hp_current >= entry.hp_max}
                          className="flex-1 flex items-center justify-center gap-0.5 rounded border border-green-900 bg-green-950/20 py-1 text-xs text-green-400 hover:bg-green-950/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Plus size={10} />
                          {delta}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* MP section */}
                  <div className="flex items-center gap-3 pt-2 border-t border-coc-border">
                    <span className="text-xs text-coc-muted w-6">MP</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => adjustMp(entry, -1)}
                        disabled={entry.mp_current <= 0}
                        className="rounded border border-coc-border px-1.5 py-0.5 text-xs text-coc-muted hover:border-coc-gold hover:text-coc-text transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Minus size={10} />
                      </button>
                      <span className="text-sm font-bold tabular-nums text-blue-400 min-w-[28px] text-center">
                        {entry.mp_current}
                      </span>
                      <button
                        onClick={() => adjustMp(entry, 1)}
                        className="rounded border border-coc-border px-1.5 py-0.5 text-xs text-coc-muted hover:border-coc-gold hover:text-coc-text transition-colors"
                      >
                        <Plus size={10} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
