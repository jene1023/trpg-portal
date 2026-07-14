"use client";

import { useState, useEffect } from "react";
import { Plus, X, Dice6, Trash2, RefreshCw } from "lucide-react";
import { supabase, isSupabaseConfigured, RandomTable, RandomTableEntry, DiceType } from "@/lib/supabase";

const DICE_TYPES: DiceType[] = ["d6", "d8", "d10", "d12", "d20", "d100"];
const DICE_MAX: Record<DiceType, number> = {
  d6: 6, d8: 8, d10: 10, d12: 12, d20: 20, d100: 100,
};

const fieldClass =
  "w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder-coc-faint focus:outline-none focus:border-coc-gold transition-colors";
const labelClass = "block text-xs font-medium text-coc-muted mb-1";

type TableWithEntries = RandomTable & { random_table_entries: RandomTableEntry[] };
type EntryDraft = { min: string; max: string; result: string };

function rollDice(diceType: DiceType): number {
  const max = DICE_MAX[diceType];
  return Math.floor(Math.random() * max) + 1;
}

export default function KpRandomTablesPage() {
  const [tables, setTables] = useState<TableWithEntries[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDiceType, setNewDiceType] = useState<DiceType>("d6");
  const [entries, setEntries] = useState<EntryDraft[]>([{ min: "1", max: "1", result: "" }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTableId, setActiveTableId] = useState<string | null>(null);
  const [rollResult, setRollResult] = useState<{ roll: number; matched: string | null } | null>(null);
  const [rolling, setRolling] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    loadTables();
  }, []);

  async function loadTables() {
    setLoading(true);
    const { data } = await supabase
      .from("random_tables")
      .select("*, random_table_entries(*)")
      .order("created_at", { ascending: false });
    setTables((data ?? []) as TableWithEntries[]);
    setLoading(false);
  }

  function openCreate() {
    setNewName("");
    setNewDiceType("d6");
    setEntries([{ min: "1", max: "1", result: "" }]);
    setError(null);
    setCreating(true);
  }

  function closeCreate() {
    setCreating(false);
    setError(null);
  }

  function addEntry() {
    setEntries((prev) => [...prev, { min: "", max: "", result: "" }]);
  }

  function updateEntry(i: number, field: keyof EntryDraft, value: string) {
    setEntries((prev) => prev.map((e, idx) => (idx === i ? { ...e, [field]: value } : e)));
  }

  function removeEntry(i: number) {
    setEntries((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSave() {
    if (!isSupabaseConfigured || !newName.trim()) return;
    const validEntries = entries.filter((e) => e.result.trim() && e.min && e.max);
    if (validEntries.length === 0) {
      setError("エントリを1件以上入力してください");
      return;
    }
    setSaving(true);
    setError(null);

    const { data: tbl, error: tblErr } = await supabase
      .from("random_tables")
      .insert({ name: newName.trim(), dice_type: newDiceType })
      .select()
      .single();

    if (tblErr || !tbl) {
      setError(tblErr?.message ?? "テーブルの作成に失敗しました");
      setSaving(false);
      return;
    }

    const { error: entErr } = await supabase
      .from("random_table_entries")
      .insert(
        validEntries.map((e) => ({
          table_id: tbl.id,
          roll_min: Number(e.min),
          roll_max: Number(e.max),
          result_text: e.result.trim(),
        }))
      );

    if (entErr) {
      setError(entErr.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    closeCreate();
    loadTables();
  }

  async function handleDelete(id: string) {
    if (!isSupabaseConfigured) return;
    await supabase.from("random_tables").delete().eq("id", id);
    setTables((prev) => prev.filter((t) => t.id !== id));
    if (activeTableId === id) {
      setActiveTableId(null);
      setRollResult(null);
    }
    setDeleteConfirmId(null);
  }

  function handleRoll(table: TableWithEntries) {
    if (rolling) return;
    setActiveTableId(table.id);
    setRolling(true);
    setRollResult(null);
    setTimeout(() => {
      const roll = rollDice(table.dice_type as DiceType);
      const entry = table.random_table_entries.find(
        (e) => roll >= e.roll_min && roll <= e.roll_max
      );
      setRollResult({ roll, matched: entry?.result_text ?? null });
      setRolling(false);
    }, 300);
  }

  return (
    <div className="min-h-screen coc-bg px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <nav className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-coc-muted">
          <a href="/kp/party-templates" className="hover:text-coc-gold transition-colors">パーティーテンプレート</a>
          <span>·</span>
          <a href="/kp/narration" className="hover:text-coc-gold transition-colors">ナレーション生成</a>
          <span>·</span>
          <a href="/kp/player-notes" className="hover:text-coc-gold transition-colors">常連プレイヤー台帳</a>
          <span>·</span>
          <a href="/kp/encounters" className="hover:text-coc-gold transition-colors">エンカウンター</a>
          <span>·</span>
          <span className="text-coc-gold">ランダムテーブル</span>
        </nav>

        <div>
          <h1 className="font-cinzel text-2xl font-bold text-coc-gold tracking-widest mb-1">
            ランダムテーブル管理
          </h1>
          <p className="text-sm text-coc-muted">
            シナリオ独自のランダムテーブルを作成し、セッション中にワンクリックでロールできます。
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl border border-dashed border-coc-border bg-coc-surface px-5 py-4 w-full text-sm text-coc-muted hover:border-coc-gold hover:text-coc-gold transition-colors"
        >
          <Plus size={16} />
          新しいテーブルを作成
        </button>

        {loading ? (
          <div className="text-center py-10 text-sm text-coc-muted">読み込み中…</div>
        ) : tables.length === 0 ? (
          <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-10 text-center">
            <Dice6 size={32} className="mx-auto mb-3 text-coc-faint" />
            <p className="text-sm text-coc-muted">テーブルがまだありません</p>
            <p className="text-xs text-coc-faint mt-1">上のボタンから作成してください</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-coc-muted uppercase tracking-widest">
              テーブル一覧 ({tables.length}件)
            </p>
            {tables.map((table) => {
              const isActive = activeTableId === table.id;
              return (
                <div key={table.id} className="rounded-xl border border-coc-border bg-coc-surface overflow-hidden">
                  <div className="px-5 py-4 flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTableId(isActive ? null : table.id);
                        setRollResult(null);
                      }}
                      className="flex-1 text-left min-w-0"
                    >
                      <p className="font-cinzel font-semibold text-coc-text text-sm">{table.name}</p>
                      <p className="text-xs text-coc-muted mt-0.5">
                        {table.dice_type.toUpperCase()} · {table.random_table_entries.length}エントリ
                      </p>
                    </button>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {deleteConfirmId === table.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDelete(table.id)}
                            className="text-xs rounded px-2 py-1 bg-red-900/50 text-red-300 border border-red-700 hover:bg-red-800/50 transition-colors"
                          >
                            削除確定
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="text-xs rounded px-2 py-1 text-coc-muted border border-coc-border hover:text-coc-text transition-colors"
                          >
                            キャンセル
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(table.id)}
                          className="rounded-lg border border-coc-border p-1.5 text-coc-faint hover:text-red-400 hover:border-red-700 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRoll(table)}
                        disabled={rolling}
                        className="flex items-center gap-1.5 rounded-lg border border-coc-gold text-coc-gold px-3 py-1.5 text-xs hover:bg-coc-gold/10 transition-colors disabled:opacity-40"
                      >
                        <Dice6 size={13} className={rolling && isActive ? "animate-spin" : ""} />
                        ロール！
                      </button>
                    </div>
                  </div>

                  {isActive && (
                    <div className="border-t border-coc-border px-5 py-4 space-y-3">
                      {rollResult && (
                        <div className="rounded-lg border border-coc-gold bg-coc-gold/5 px-4 py-3 flex items-center justify-between animate-in fade-in slide-in-from-bottom-1 duration-300">
                          <div>
                            <p className="text-xs text-coc-muted mb-0.5">結果</p>
                            <p className="text-sm font-semibold text-coc-text">
                              {rollResult.matched ?? "—（該当エントリなし）"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-coc-muted mb-0.5">ロール</p>
                            <p className="font-cinzel text-2xl font-bold text-coc-gold">{rollResult.roll}</p>
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRoll(table)}
                        disabled={rolling}
                        className="flex items-center gap-2 w-full justify-center rounded-lg border border-coc-gold text-coc-gold py-2 text-sm hover:bg-coc-gold/10 transition-colors disabled:opacity-40"
                      >
                        <RefreshCw size={13} className={rolling ? "animate-spin" : ""} />
                        もう一度ロール
                      </button>

                      <div className="space-y-1.5">
                        <p className="text-[10px] font-semibold text-coc-muted uppercase tracking-widest">エントリ一覧</p>
                        {table.random_table_entries
                          .slice()
                          .sort((a, b) => a.roll_min - b.roll_min)
                          .map((entry) => {
                            const isMatched =
                              rollResult !== null &&
                              rollResult.roll >= entry.roll_min &&
                              rollResult.roll <= entry.roll_max;
                            return (
                              <div
                                key={entry.id}
                                className={`rounded-md px-3 py-2 flex items-center gap-3 transition-colors ${
                                  isMatched
                                    ? "border border-coc-gold bg-coc-gold/10"
                                    : "border border-coc-border bg-coc-raised"
                                }`}
                              >
                                <span className="font-cinzel text-xs text-coc-muted shrink-0 w-14 text-center">
                                  {entry.roll_min === entry.roll_max
                                    ? entry.roll_min
                                    : `${entry.roll_min}–${entry.roll_max}`}
                                </span>
                                <span
                                  className={`text-sm ${isMatched ? "text-coc-gold font-semibold" : "text-coc-text"}`}
                                >
                                  {entry.result_text}
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {creating && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeCreate();
          }}
        >
          <div className="w-full max-w-lg rounded-2xl border border-coc-border bg-coc-surface p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-cinzel text-base font-semibold text-coc-text">
                ランダムテーブルを作成
              </h2>
              <button
                type="button"
                onClick={closeCreate}
                className="text-coc-faint hover:text-coc-text transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <label className={labelClass}>テーブル名 *</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="例: 狂気症状表"
                className={fieldClass}
              />
            </div>

            <div>
              <label className={labelClass}>ダイス種別 *</label>
              <select
                value={newDiceType}
                onChange={(e) => setNewDiceType(e.target.value as DiceType)}
                className={fieldClass}
              >
                {DICE_TYPES.map((d) => (
                  <option key={d} value={d}>
                    {d.toUpperCase()}（1〜{DICE_MAX[d]}）
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className={labelClass}>エントリ *</label>
                <button
                  type="button"
                  onClick={addEntry}
                  className="text-xs text-coc-gold hover:underline flex items-center gap-1"
                >
                  <Plus size={12} />
                  行を追加
                </button>
              </div>
              <div className="space-y-2">
                <div className="grid grid-cols-[52px_52px_1fr_28px] gap-1.5 text-[10px] text-coc-muted px-1">
                  <span>最小</span>
                  <span>最大</span>
                  <span>結果テキスト</span>
                  <span />
                </div>
                {entries.map((entry, i) => (
                  <div key={i} className="grid grid-cols-[52px_52px_1fr_28px] gap-1.5 items-center">
                    <input
                      type="number"
                      min={1}
                      max={DICE_MAX[newDiceType]}
                      value={entry.min}
                      onChange={(e) => updateEntry(i, "min", e.target.value)}
                      className="rounded border border-coc-border bg-coc-raised px-2 py-1.5 text-sm text-coc-text focus:outline-none focus:border-coc-gold text-center"
                    />
                    <input
                      type="number"
                      min={1}
                      max={DICE_MAX[newDiceType]}
                      value={entry.max}
                      onChange={(e) => updateEntry(i, "max", e.target.value)}
                      className="rounded border border-coc-border bg-coc-raised px-2 py-1.5 text-sm text-coc-text focus:outline-none focus:border-coc-gold text-center"
                    />
                    <input
                      value={entry.result}
                      onChange={(e) => updateEntry(i, "result", e.target.value)}
                      placeholder="例: 暗闇に蠢く影"
                      className="rounded border border-coc-border bg-coc-raised px-2 py-1.5 text-sm text-coc-text focus:outline-none focus:border-coc-gold placeholder-coc-faint"
                    />
                    <button
                      type="button"
                      onClick={() => removeEntry(i)}
                      disabled={entries.length <= 1}
                      className="w-7 h-7 flex items-center justify-center rounded text-coc-faint hover:text-red-400 transition-colors disabled:opacity-30"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-700 bg-red-900/20 px-3 py-2 text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeCreate}
                className="rounded-lg border border-coc-border px-4 py-2 text-sm text-coc-muted hover:text-coc-text transition-colors"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !newName.trim()}
                className="rounded-lg bg-coc-gold text-black font-semibold text-sm px-5 py-2 disabled:opacity-50 hover:brightness-110 transition-all"
              >
                {saving ? "保存中…" : "作成する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
