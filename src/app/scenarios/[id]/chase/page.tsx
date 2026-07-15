"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Activity,
  RotateCcw,
  Plus,
  Minus,
  Trash2,
  Radio,
  X,
} from "lucide-react";
import {
  supabase,
  isSupabaseConfigured,
  Character,
  ScenarioParticipant,
} from "@/lib/supabase";

type ChaseEntry = {
  id: string;
  scenario_id: string;
  entry_name: string;
  is_npc: boolean;
  spd: number;
  distance_counter: number;
  is_escaped: boolean;
  is_caught: boolean;
  action_this_round: string | null;
  created_at: string;
};

type ParticipantWithCharacter = ScenarioParticipant & {
  characters: Pick<Character, "id" | "name" | "dex">;
};

export default function ChasePage() {
  const params = useParams<{ id: string }>();
  const scenarioId = params.id;

  const [scenarioTitle, setScenarioTitle] = useState("");
  const [entries, setEntries] = useState<ChaseEntry[]>([]);
  const [round, setRound] = useState(1);
  const [escapeDistance, setEscapeDistance] = useState(10);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const [newName, setNewName] = useState("");
  const [newSpd, setNewSpd] = useState("");
  const [newIsChaser, setNewIsChaser] = useState(false);

  const [actionInputs, setActionInputs] = useState<Record<string, string>>({});

  const sorted = [...entries].sort((a, b) => {
    const aEnd = a.is_escaped || a.is_caught;
    const bEnd = b.is_escaped || b.is_caught;
    if (aEnd !== bEnd) return aEnd ? 1 : -1;
    return b.spd - a.spd;
  });

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    async function reload() {
      const { data } = await supabase
        .from("chase_entries")
        .select("*")
        .eq("scenario_id", scenarioId)
        .order("spd", { ascending: false });
      setEntries((data ?? []) as ChaseEntry[]);
    }

    async function loadAll() {
      const [{ data: scenario }, { data: participants }, { data: existing }] =
        await Promise.all([
          supabase.from("scenarios").select("title").eq("id", scenarioId).single(),
          supabase
            .from("scenario_participants")
            .select("*, characters(id, name, dex)")
            .eq("scenario_id", scenarioId),
          supabase
            .from("chase_entries")
            .select("*")
            .eq("scenario_id", scenarioId),
        ]);

      setScenarioTitle(scenario?.title ?? "");

      if ((existing ?? []).length === 0 && (participants ?? []).length > 0) {
        const list = (participants ?? []) as ParticipantWithCharacter[];
        const toInsert = list.map((p) => ({
          scenario_id: scenarioId,
          entry_name: p.characters.name,
          is_npc: false,
          spd: p.characters.dex,
          distance_counter: 0,
          is_escaped: false,
          is_caught: false,
          action_this_round: null,
        }));
        await supabase.from("chase_entries").insert(toInsert);
        await reload();
      } else {
        setEntries((existing ?? []) as ChaseEntry[]);
      }

      setLoading(false);
    }

    loadAll();

    const channel = supabase
      .channel(`chase-${scenarioId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chase_entries",
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

  async function addParticipant() {
    const spdNum = parseInt(newSpd, 10) || 0;
    if (!newName.trim() || !isSupabaseConfigured) return;
    await supabase.from("chase_entries").insert({
      scenario_id: scenarioId,
      entry_name: newName.trim(),
      is_npc: newIsChaser,
      spd: spdNum,
      distance_counter: 0,
      is_escaped: false,
      is_caught: false,
      action_this_round: null,
    });
    setNewName("");
    setNewSpd("");
  }

  async function adjustDistance(entry: ChaseEntry, delta: number) {
    if (!isSupabaseConfigured) return;
    const newVal = entry.distance_counter + delta;
    const isEscaped = newVal >= escapeDistance;
    const isCaught = newVal <= 0 && delta < 0 && entry.distance_counter > 0;
    setEntries((prev) =>
      prev.map((e) =>
        e.id === entry.id
          ? { ...e, distance_counter: newVal, is_escaped: isEscaped, is_caught: e.is_caught || isCaught }
          : e
      )
    );
    await supabase
      .from("chase_entries")
      .update({
        distance_counter: newVal,
        is_escaped: isEscaped,
        is_caught: entry.is_caught || isCaught,
      })
      .eq("id", entry.id);
  }

  async function toggleEscaped(entry: ChaseEntry) {
    if (!isSupabaseConfigured) return;
    const newVal = !entry.is_escaped;
    setEntries((prev) =>
      prev.map((e) => (e.id === entry.id ? { ...e, is_escaped: newVal } : e))
    );
    await supabase
      .from("chase_entries")
      .update({ is_escaped: newVal })
      .eq("id", entry.id);
  }

  async function toggleCaught(entry: ChaseEntry) {
    if (!isSupabaseConfigured) return;
    const newVal = !entry.is_caught;
    setEntries((prev) =>
      prev.map((e) => (e.id === entry.id ? { ...e, is_caught: newVal } : e))
    );
    await supabase
      .from("chase_entries")
      .update({ is_caught: newVal })
      .eq("id", entry.id);
  }

  async function saveAction(entry: ChaseEntry, action: string) {
    if (!isSupabaseConfigured) return;
    setEntries((prev) =>
      prev.map((e) =>
        e.id === entry.id ? { ...e, action_this_round: action } : e
      )
    );
    await supabase
      .from("chase_entries")
      .update({ action_this_round: action })
      .eq("id", entry.id);
  }

  async function clearActions() {
    if (!isSupabaseConfigured) return;
    setEntries((prev) =>
      prev.map((e) => ({ ...e, action_this_round: null }))
    );
    setActionInputs({});
    await supabase
      .from("chase_entries")
      .update({ action_this_round: null })
      .eq("scenario_id", scenarioId);
  }

  async function removeEntry(id: string) {
    if (!isSupabaseConfigured) return;
    setEntries((prev) => prev.filter((e) => e.id !== id));
    await supabase.from("chase_entries").delete().eq("id", id);
  }

  async function resetChase() {
    if (!isSupabaseConfigured) return;
    if (!confirm("チェイスデータをリセットしますか？全エントリが削除されます。")) return;
    await supabase.from("chase_entries").delete().eq("scenario_id", scenarioId);
    setEntries([]);
    setRound(1);
  }

  function statusBadge(entry: ChaseEntry) {
    if (entry.is_escaped) {
      return (
        <span className="rounded-full border border-green-700 bg-green-950/30 px-2.5 py-0.5 text-xs font-medium text-green-400">
          逃走成功
        </span>
      );
    }
    if (entry.is_caught) {
      return (
        <span className="rounded-full border border-red-700 bg-red-950/30 px-2.5 py-0.5 text-xs font-medium text-red-400">
          捕捉
        </span>
      );
    }
    return null;
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
            <Activity size={20} className="text-coc-gold" />
            🏃 チェイストラッカー
          </h1>
          <p className="text-xs text-coc-muted mt-1">
            SPD順・距離カウンター・逃走/捕捉判定（リアルタイム同期）
          </p>
        </div>
        <button
          onClick={resetChase}
          className="flex items-center gap-1.5 rounded-lg border border-coc-border px-3 py-1.5 text-xs text-coc-muted hover:text-red-400 hover:border-red-800 transition-colors"
        >
          <RotateCcw size={14} />
          リセット
        </button>
      </div>

      {/* Round counter and escape distance */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-coc-gold-dim bg-coc-surface px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-coc-muted mb-1">現在ラウンド</p>
            <p className="text-4xl font-bold text-coc-gold tabular-nums">{round}</p>
          </div>
          <button
            onClick={() => {
              setRound((r) => r + 1);
              clearActions();
            }}
            className="flex flex-col items-center gap-0.5 rounded-lg border border-coc-gold bg-coc-gold/10 px-3 py-2 text-xs font-medium text-coc-gold hover:bg-coc-gold/20 transition-colors"
          >
            <span>次のR</span>
            <span className="text-coc-muted font-normal">({round + 1})</span>
          </button>
        </div>

        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4">
          <p className="text-xs text-coc-muted mb-2">逃走成功距離（以上）</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEscapeDistance((d) => Math.max(1, d - 1))}
              className="rounded border border-coc-border px-2 py-1 text-xs text-coc-muted hover:border-coc-gold hover:text-coc-text transition-colors"
            >
              <Minus size={10} />
            </button>
            <span className="text-2xl font-bold text-coc-text tabular-nums min-w-[2.5rem] text-center">
              {escapeDistance}
            </span>
            <button
              onClick={() => setEscapeDistance((d) => d + 1)}
              className="rounded border border-coc-border px-2 py-1 text-xs text-coc-muted hover:border-coc-gold hover:text-coc-text transition-colors"
            >
              <Plus size={10} />
            </button>
          </div>
        </div>
      </div>

      {/* Add participant form */}
      <div className="mb-6 rounded-xl border border-coc-border bg-coc-surface px-4 py-4">
        <p className="text-xs font-medium text-coc-muted mb-3">参加者を追加（NPC/追跡者）</p>
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            placeholder="名前"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addParticipant()}
            className="flex-1 min-w-[110px] rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:outline-none focus:border-coc-gold"
          />
          <input
            type="number"
            placeholder="SPD"
            value={newSpd}
            onChange={(e) => setNewSpd(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addParticipant()}
            className="w-20 rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:outline-none focus:border-coc-gold"
          />
          <label className="flex items-center gap-1.5 text-xs text-coc-muted cursor-pointer select-none">
            <input
              type="checkbox"
              checked={newIsChaser}
              onChange={(e) => setNewIsChaser(e.target.checked)}
              className="accent-coc-gold"
            />
            NPC
          </label>
          <button
            onClick={addParticipant}
            disabled={!newName.trim()}
            className="flex items-center gap-1 rounded-lg border border-coc-gold bg-coc-gold/10 px-3 py-2 text-sm text-coc-gold hover:bg-coc-gold/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus size={15} />
            追加
          </button>
        </div>
      </div>

      {/* Chase entries */}
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
          <p className="text-xs text-coc-muted mb-3">SPD順（高い順）</p>
          <div className="flex flex-col gap-3 mb-6">
            {sorted.map((entry, index) => {
              const isResolved = entry.is_escaped || entry.is_caught;
              const distPct = Math.min(
                100,
                Math.max(0, (entry.distance_counter / escapeDistance) * 100)
              );

              return (
                <div
                  key={entry.id}
                  className={`rounded-xl border px-4 py-3 transition-colors ${
                    isResolved
                      ? "border-coc-border bg-coc-raised opacity-70"
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
                              isResolved ? "text-coc-muted line-through" : "text-coc-text"
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
                          {statusBadge(entry)}
                        </div>
                        <p className="text-xs text-coc-muted">SPD {entry.spd}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => toggleEscaped(entry)}
                        className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                          entry.is_escaped
                            ? "border-green-700 text-green-400"
                            : "border-coc-border text-coc-muted hover:border-green-700 hover:text-green-400"
                        }`}
                      >
                        逃走
                      </button>
                      <button
                        onClick={() => toggleCaught(entry)}
                        className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                          entry.is_caught
                            ? "border-red-700 text-red-400"
                            : "border-coc-border text-coc-muted hover:border-red-700 hover:text-red-400"
                        }`}
                      >
                        捕捉
                      </button>
                      <button
                        onClick={() => removeEntry(entry.id)}
                        className="text-coc-muted hover:text-red-400 transition-colors"
                        aria-label="削除"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Distance counter */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-coc-muted">距離カウンター</span>
                      <span
                        className={`text-lg font-bold tabular-nums ${
                          entry.is_escaped
                            ? "text-green-400"
                            : entry.distance_counter <= 0
                            ? "text-red-400"
                            : "text-coc-text"
                        }`}
                      >
                        {entry.distance_counter}
                        <span className="text-xs font-normal text-coc-muted ml-1">
                          / {escapeDistance}
                        </span>
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-coc-raised overflow-hidden mb-2">
                      <div
                        className={`h-full rounded-full transition-all ${
                          distPct >= 100
                            ? "bg-green-500"
                            : distPct >= 50
                            ? "bg-yellow-500"
                            : "bg-coc-gold"
                        }`}
                        style={{ width: `${distPct}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs text-coc-muted mb-1">追跡者（距離を縮める）</p>
                        <div className="flex gap-1">
                          {[1, 2, 3].map((d) => (
                            <button
                              key={d}
                              onClick={() => adjustDistance(entry, -d)}
                              disabled={isResolved}
                              className="flex-1 flex items-center justify-center gap-0.5 rounded border border-red-900 bg-red-950/20 py-1 text-xs text-red-400 hover:bg-red-950/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Minus size={10} />
                              {d}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-coc-muted mb-1">逃走者（距離を広げる）</p>
                        <div className="flex gap-1">
                          {[1, 2, 3].map((d) => (
                            <button
                              key={d}
                              onClick={() => adjustDistance(entry, d)}
                              disabled={isResolved}
                              className="flex-1 flex items-center justify-center gap-0.5 rounded border border-green-900 bg-green-950/20 py-1 text-xs text-green-400 hover:bg-green-950/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Plus size={10} />
                              {d}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action this round */}
                  <div className="pt-2 border-t border-coc-border">
                    <p className="text-xs text-coc-muted mb-1">今ラウンドの行動</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Athletics判定成功・妨害アクションなど"
                        value={actionInputs[entry.id] ?? entry.action_this_round ?? ""}
                        onChange={(e) =>
                          setActionInputs((prev) => ({
                            ...prev,
                            [entry.id]: e.target.value,
                          }))
                        }
                        onBlur={(e) => {
                          saveAction(entry, e.target.value);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            saveAction(entry, actionInputs[entry.id] ?? "");
                          }
                        }}
                        className="flex-1 rounded-lg border border-coc-border bg-coc-raised px-3 py-1.5 text-xs text-coc-text placeholder:text-coc-muted focus:outline-none focus:border-coc-gold"
                      />
                      {(actionInputs[entry.id] || entry.action_this_round) && (
                        <button
                          onClick={() => {
                            setActionInputs((prev) => ({ ...prev, [entry.id]: "" }));
                            saveAction(entry, "");
                          }}
                          className="text-coc-muted hover:text-coc-text transition-colors"
                          aria-label="クリア"
                        >
                          <X size={14} />
                        </button>
                      )}
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
