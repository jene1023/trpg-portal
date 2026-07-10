"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  Play,
  Square,
  Plus,
  Trash2,
  Radio,
  Swords,
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type InitiativeEntry = {
  id: string;
  scenario_id: string;
  label: string;
  initiative_value: number;
  is_npc: boolean;
  is_active: boolean;
  order_index: number;
  created_at: string;
};

type Props = { params: Promise<{ id: string }> };

export default function InitiativePage({ params }: Props) {
  const { id } = use(params);
  const [entries, setEntries] = useState<InitiativeEntry[]>([]);
  const [round, setRound] = useState(1);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newLabel, setNewLabel] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newIsNpc, setNewIsNpc] = useState(false);

  const sorted = [...entries].sort((a, b) => b.initiative_value - a.initiative_value);
  const hasActive = entries.some((e) => e.is_active);
  const activeIdx = sorted.findIndex((e) => e.is_active);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    async function loadEntries() {
      const { data } = await supabase
        .from("initiative_entries")
        .select("*")
        .eq("scenario_id", id)
        .order("initiative_value", { ascending: false });
      setEntries((data ?? []) as InitiativeEntry[]);
      setLoading(false);
    }

    loadEntries();

    const channel = supabase
      .channel(`initiative-${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "initiative_entries",
          filter: `scenario_id=eq.${id}`,
        },
        () => {
          loadEntries();
        }
      )
      .subscribe((status: string) => {
        setConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
      setConnected(false);
    };
  }, [id]);

  async function addEntry() {
    const value = parseInt(newValue, 10);
    if (!newLabel.trim() || isNaN(value)) return;
    await supabase.from("initiative_entries").insert({
      scenario_id: id,
      label: newLabel.trim(),
      initiative_value: value,
      is_npc: newIsNpc,
      is_active: false,
      order_index: 0,
    });
    setNewLabel("");
    setNewValue("");
    setNewIsNpc(false);
  }

  async function removeEntry(entryId: string) {
    await supabase.from("initiative_entries").delete().eq("id", entryId);
  }

  async function startCombat() {
    if (sorted.length === 0) return;
    await supabase
      .from("initiative_entries")
      .update({ is_active: false })
      .eq("scenario_id", id);
    await supabase
      .from("initiative_entries")
      .update({ is_active: true })
      .eq("id", sorted[0].id);
    setRound(1);
  }

  async function nextTurn() {
    if (sorted.length === 0) return;
    const curIdx = sorted.findIndex((e) => e.is_active);
    const nextIdx = curIdx === -1 ? 0 : (curIdx + 1) % sorted.length;
    if (nextIdx === 0 && curIdx !== -1) {
      setRound((r) => r + 1);
    }
    await supabase
      .from("initiative_entries")
      .update({ is_active: false })
      .eq("scenario_id", id);
    await supabase
      .from("initiative_entries")
      .update({ is_active: true })
      .eq("id", sorted[nextIdx].id);
  }

  async function endCombat() {
    await supabase
      .from("initiative_entries")
      .update({ is_active: false })
      .eq("scenario_id", id);
    setRound(1);
  }

  async function clearAll() {
    if (!confirm("全エントリを削除しますか？")) return;
    await supabase.from("initiative_entries").delete().eq("scenario_id", id);
    setRound(1);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-xl px-4 py-8">
        <p className="text-sm text-coc-muted">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <Link
          href={`/scenarios/${id}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          シナリオ詳細
        </Link>
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
      </div>

      <div className="mb-6">
        <h1 className="font-cinzel text-xl font-bold text-coc-text flex items-center gap-2">
          <Swords size={20} className="text-coc-gold" />
          イニシアティブトラッカー
        </h1>
        <p className="text-xs text-coc-muted mt-1">
          戦闘ラウンドの行動順をリアルタイムで全員と共有します。
        </p>
      </div>

      {!isSupabaseConfigured && (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4 text-sm text-coc-muted text-center">
          Supabase が設定されていないため、リアルタイム機能は利用できません。
        </div>
      )}

      {isSupabaseConfigured && (
        <>
          {/* Round counter */}
          <div className="mb-4 rounded-xl border border-coc-gold-dim bg-coc-surface px-5 py-4 text-center">
            <p className="text-xs text-coc-muted mb-1">現在ラウンド</p>
            <p className="text-4xl font-bold text-coc-gold tabular-nums">{round}</p>
            {hasActive && (
              <p className="text-xs text-coc-muted mt-1">
                順番 {activeIdx + 1} / {sorted.length}
              </p>
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {!hasActive ? (
              <button
                onClick={startCombat}
                disabled={sorted.length === 0}
                className="flex items-center gap-1.5 rounded-lg border border-coc-gold bg-coc-gold/10 px-3 py-2 text-sm text-coc-gold hover:bg-coc-gold/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Play size={14} />
                戦闘開始
              </button>
            ) : (
              <>
                <button
                  onClick={nextTurn}
                  className="flex items-center gap-1.5 rounded-lg border border-coc-gold bg-coc-gold/10 px-3 py-2 text-sm text-coc-gold hover:bg-coc-gold/20 transition-colors"
                >
                  <ChevronRight size={14} />
                  次のキャラクターへ
                </button>
                <button
                  onClick={endCombat}
                  className="flex items-center gap-1.5 rounded-lg border border-coc-border px-3 py-2 text-xs text-coc-muted hover:text-coc-text hover:border-coc-gold transition-colors"
                >
                  <Square size={14} />
                  戦闘終了
                </button>
              </>
            )}
            <button
              onClick={clearAll}
              className="ml-auto flex items-center gap-1.5 rounded-lg border border-red-900 px-3 py-2 text-xs text-red-400 hover:border-red-600 transition-colors"
            >
              <Trash2 size={14} />
              全消去
            </button>
          </div>

          {/* Add entry form */}
          <div className="mb-6 rounded-xl border border-coc-border bg-coc-surface px-4 py-4">
            <p className="text-xs font-medium text-coc-muted mb-3">エントリを追加</p>
            <div className="flex gap-2 flex-wrap items-center">
              <input
                type="text"
                placeholder="名前（PC/NPC）"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addEntry()}
                className="flex-1 min-w-[120px] rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:outline-none focus:border-coc-gold"
              />
              <input
                type="number"
                placeholder="値"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addEntry()}
                className="w-20 rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:outline-none focus:border-coc-gold"
              />
              <label className="flex items-center gap-1.5 text-xs text-coc-muted cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={newIsNpc}
                  onChange={(e) => setNewIsNpc(e.target.checked)}
                  className="rounded border-coc-border"
                />
                NPC
              </label>
              <button
                onClick={addEntry}
                disabled={!newLabel.trim() || !newValue}
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
              <Swords size={32} className="text-coc-muted mx-auto mb-3 opacity-40" />
              <p className="text-sm text-coc-muted">エントリがありません</p>
              <p className="text-xs text-coc-muted mt-1">
                PC・NPCを追加して「戦闘開始」を押してください
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {sorted.map((entry, index) => (
                <div
                  key={entry.id}
                  className={`rounded-xl border px-4 py-3 transition-all ${
                    entry.is_active
                      ? "border-coc-gold bg-coc-gold/5 ring-1 ring-coc-gold/20"
                      : "border-coc-border bg-coc-surface"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {entry.is_active ? (
                        <ChevronRight size={18} className="text-coc-gold flex-shrink-0" />
                      ) : (
                        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-coc-border text-xs text-coc-muted">
                          {index + 1}
                        </span>
                      )}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p
                            className={`font-medium ${
                              entry.is_active ? "text-coc-gold" : "text-coc-text"
                            }`}
                          >
                            {entry.label}
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
                          {entry.is_active && (
                            <span className="rounded-full border border-coc-gold px-1.5 py-0.5 text-xs text-coc-gold animate-pulse">
                              行動中
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-coc-muted mt-0.5">
                          イニシアティブ: {entry.initiative_value}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeEntry(entry.id)}
                      className="text-coc-muted hover:text-red-400 transition-colors flex-shrink-0"
                      aria-label="削除"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
