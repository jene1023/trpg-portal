"use client";

import { useState } from "react";
import { Plus, Trash2, Dices } from "lucide-react";
import { supabase, isSupabaseConfigured, RandomTable, RandomTableEntry, DiceType } from "@/lib/supabase";

const DICE_MAX: Record<DiceType, number> = {
  d6: 6,
  d8: 8,
  d10: 10,
  d12: 12,
  d20: 20,
  d100: 100,
};

type Props = {
  table: RandomTable;
  initialEntries: RandomTableEntry[];
};

export default function RandomTableDetail({ table, initialEntries }: Props) {
  const [entries, setEntries] = useState<RandomTableEntry[]>(initialEntries);
  const [rollMin, setRollMin] = useState(1);
  const [rollMax, setRollMax] = useState(1);
  const [resultText, setResultText] = useState("");
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rolledValue, setRolledValue] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);

  const diceMax = DICE_MAX[table.dice_type];

  async function addEntry() {
    if (!resultText.trim() || !isSupabaseConfigured) return;
    if (rollMin < 1 || rollMax > diceMax || rollMin > rollMax) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("random_table_entries")
      .insert({
        table_id: table.id,
        roll_min: rollMin,
        roll_max: rollMax,
        result_text: resultText.trim(),
      })
      .select()
      .single();
    if (!error && data) {
      setEntries((prev) =>
        [...prev, data as RandomTableEntry].sort((a, b) => a.roll_min - b.roll_min)
      );
      setRollMin(1);
      setRollMax(1);
      setResultText("");
      setAdding(false);
    }
    setSaving(false);
  }

  async function deleteEntry(id: string) {
    if (!isSupabaseConfigured) return;
    await supabase.from("random_table_entries").delete().eq("id", id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
    if (rolledValue !== null) {
      const stillHit = entries
        .filter((e) => e.id !== id)
        .some((e) => rolledValue >= e.roll_min && rolledValue <= e.roll_max);
      if (!stillHit) setRolledValue(null);
    }
  }

  function roll() {
    if (rolling) return;
    setRolling(true);
    setRolledValue(null);
    setTimeout(() => {
      const value = Math.ceil(Math.random() * diceMax);
      setRolledValue(value);
      setRolling(false);
    }, 350);
  }

  const hitEntry = rolledValue !== null
    ? entries.find((e) => rolledValue >= e.roll_min && rolledValue <= e.roll_max) ?? null
    : null;

  return (
    <div className="space-y-4">
      <button
        onClick={roll}
        disabled={entries.length === 0 || rolling}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-coc-gold bg-coc-gold/10 py-3 text-sm font-semibold text-coc-gold hover:bg-coc-gold/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Dices size={18} className={rolling ? "animate-spin" : ""} />
        {table.dice_type.toUpperCase()} をロール
      </button>

      {rolledValue !== null && (
        <div className={`rounded-xl border px-5 py-4 transition-all ${hitEntry ? "border-coc-gold bg-coc-gold/5" : "border-coc-border bg-coc-raised"}`}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-coc-muted">ロール結果</p>
            <span className="font-cinzel text-3xl font-bold text-coc-gold">{rolledValue}</span>
          </div>
          {hitEntry ? (
            <p className="font-semibold text-coc-text text-lg">{hitEntry.result_text}</p>
          ) : (
            <p className="text-sm text-coc-muted">この出目に対応するエントリがありません</p>
          )}
        </div>
      )}

      <div className="space-y-2">
        {entries.map((entry) => {
          const isHit = rolledValue !== null && rolledValue >= entry.roll_min && rolledValue <= entry.roll_max;
          return (
            <div
              key={entry.id}
              className={`flex items-center gap-3 rounded-xl border px-5 py-3 transition-colors ${
                isHit ? "border-coc-gold bg-coc-gold/5" : "border-coc-border bg-coc-surface"
              }`}
            >
              <span className="shrink-0 w-16 text-center rounded-md bg-coc-raised border border-coc-border text-xs font-bold text-coc-muted py-1">
                {entry.roll_min === entry.roll_max
                  ? `${entry.roll_min}`
                  : `${entry.roll_min}–${entry.roll_max}`}
              </span>
              <span className={`flex-1 text-sm ${isHit ? "text-coc-gold font-semibold" : "text-coc-text"}`}>
                {entry.result_text}
              </span>
              <button
                onClick={() => deleteEntry(entry.id)}
                className="shrink-0 p-1 rounded hover:bg-coc-raised text-red-400 transition-colors"
                aria-label="削除"
              >
                <Trash2 size={15} />
              </button>
            </div>
          );
        })}
      </div>

      {entries.length === 0 && !adding && (
        <p className="text-center text-sm text-coc-muted py-8">エントリがまだ登録されていません</p>
      )}

      {adding ? (
        <div className="rounded-xl border border-coc-gold-dim bg-coc-raised px-5 py-4 space-y-3">
          <div className="flex items-center gap-3">
            <label className="text-sm text-coc-muted shrink-0">出目範囲</label>
            <input
              type="number"
              min={1}
              max={diceMax}
              value={rollMin}
              onChange={(e) => setRollMin(Math.min(diceMax, Math.max(1, parseInt(e.target.value) || 1)))}
              className="w-20 rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text focus:border-coc-gold focus:outline-none"
            />
            <span className="text-coc-muted">〜</span>
            <input
              type="number"
              min={1}
              max={diceMax}
              value={rollMax}
              onChange={(e) => setRollMax(Math.min(diceMax, Math.max(1, parseInt(e.target.value) || 1)))}
              className="w-20 rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text focus:border-coc-gold focus:outline-none"
            />
            <span className="text-xs text-coc-muted">（1〜{diceMax}）</span>
          </div>
          <input
            type="text"
            placeholder="結果テキスト（例: 腐敗した魚の臭いがする人影）"
            value={resultText}
            onChange={(e) => setResultText(e.target.value)}
            className="w-full rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text placeholder-coc-muted focus:border-coc-gold focus:outline-none"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={addEntry}
              disabled={!resultText.trim() || saving || rollMin > rollMax}
              className="flex-1 rounded-lg bg-coc-gold py-2 text-sm font-medium text-black disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              {saving ? "保存中..." : "追加"}
            </button>
            <button
              onClick={() => {
                setAdding(false);
                setRollMin(1);
                setRollMax(1);
                setResultText("");
              }}
              className="rounded-lg border border-coc-border px-4 py-2 text-sm text-coc-muted hover:text-coc-text transition-colors"
            >
              キャンセル
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-coc-border py-3 text-sm text-coc-muted hover:border-coc-gold hover:text-coc-gold transition-colors"
        >
          <Plus size={16} />
          エントリを追加
        </button>
      )}
    </div>
  );
}
