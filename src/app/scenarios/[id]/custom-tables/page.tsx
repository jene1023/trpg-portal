"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Trash2, Dices, ChevronDown, ChevronUp, Pencil, Check, X } from "lucide-react";
import Link from "next/link";
import { supabase, isSupabaseConfigured, CustomTable, CustomTableEntry, CustomTableDiceType } from "@/lib/supabase";
import { use } from "react";

const DICE_SIDES: Record<CustomTableDiceType, number> = {
  d4: 4,
  d6: 6,
  d8: 8,
  d10: 10,
  d12: 12,
  d20: 20,
};

const DICE_TYPES: CustomTableDiceType[] = ["d4", "d6", "d8", "d10", "d12", "d20"];

type TableWithEntries = CustomTable & {
  entries: CustomTableEntry[];
};

type Props = { params: Promise<{ id: string }> };

export default function CustomTablesPage({ params }: Props) {
  const { id: scenarioId } = use(params);

  const [tables, setTables] = useState<TableWithEntries[]>([]);
  const [loading, setLoading] = useState(true);

  // new table form
  const [addingTable, setAddingTable] = useState(false);
  const [newTableName, setNewTableName] = useState("");
  const [newDiceType, setNewDiceType] = useState<CustomTableDiceType>("d6");
  const [savingTable, setSavingTable] = useState(false);

  // expanded state per table
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // roll result per table
  const [rollResults, setRollResults] = useState<Record<string, { value: number; text: string } | null>>({});
  const [rolling, setRolling] = useState<Record<string, boolean>>({});

  // editing table name
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [editingTableName, setEditingTableName] = useState("");

  // editing entry text
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editingEntryText, setEditingEntryText] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    loadTables();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioId]);

  async function loadTables() {
    setLoading(true);
    const { data: tableData } = await supabase
      .from("custom_tables")
      .select("*")
      .eq("scenario_id", scenarioId)
      .order("created_at", { ascending: true });

    if (!tableData) {
      setLoading(false);
      return;
    }

    const tableIds = tableData.map((t) => t.id);
    let allEntries: CustomTableEntry[] = [];

    if (tableIds.length > 0) {
      const { data: entryData } = await supabase
        .from("custom_table_entries")
        .select("*")
        .in("table_id", tableIds)
        .order("roll_value", { ascending: true });
      allEntries = (entryData ?? []) as CustomTableEntry[];
    }

    const result: TableWithEntries[] = tableData.map((t) => ({
      ...(t as CustomTable),
      entries: allEntries.filter((e) => e.table_id === t.id),
    }));

    setTables(result);
    setLoading(false);
  }

  async function createTable() {
    if (!newTableName.trim() || !isSupabaseConfigured) return;
    setSavingTable(true);
    const { data, error } = await supabase
      .from("custom_tables")
      .insert({
        scenario_id: scenarioId,
        table_name: newTableName.trim(),
        dice_type: newDiceType,
      })
      .select()
      .single();

    if (!error && data) {
      const sides = DICE_SIDES[newDiceType];
      const entryInserts = Array.from({ length: sides }, (_, i) => ({
        table_id: data.id,
        roll_value: i + 1,
        result_text: "",
      }));
      const { data: entryData } = await supabase
        .from("custom_table_entries")
        .insert(entryInserts)
        .select();

      const newTable: TableWithEntries = {
        ...(data as CustomTable),
        entries: (entryData ?? []) as CustomTableEntry[],
      };
      setTables((prev) => [...prev, newTable]);
      setExpandedIds((prev) => new Set([...prev, data.id]));
      setNewTableName("");
      setNewDiceType("d6");
      setAddingTable(false);
    }
    setSavingTable(false);
  }

  async function deleteTable(tableId: string) {
    if (!isSupabaseConfigured) return;
    await supabase.from("custom_table_entries").delete().eq("table_id", tableId);
    await supabase.from("custom_tables").delete().eq("id", tableId);
    setTables((prev) => prev.filter((t) => t.id !== tableId));
    setRollResults((prev) => {
      const next = { ...prev };
      delete next[tableId];
      return next;
    });
  }

  async function saveTableName(tableId: string) {
    if (!isSupabaseConfigured || !editingTableName.trim()) return;
    await supabase
      .from("custom_tables")
      .update({ table_name: editingTableName.trim() })
      .eq("id", tableId);
    setTables((prev) =>
      prev.map((t) =>
        t.id === tableId ? { ...t, table_name: editingTableName.trim() } : t
      )
    );
    setEditingTableId(null);
  }

  async function saveEntryText(entry: CustomTableEntry, text: string) {
    if (!isSupabaseConfigured) return;
    await supabase
      .from("custom_table_entries")
      .update({ result_text: text })
      .eq("id", entry.id);
    setTables((prev) =>
      prev.map((t) =>
        t.id === entry.table_id
          ? {
              ...t,
              entries: t.entries.map((e) =>
                e.id === entry.id ? { ...e, result_text: text } : e
              ),
            }
          : t
      )
    );
    setEditingEntryId(null);
  }

  function toggleExpand(tableId: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(tableId)) next.delete(tableId);
      else next.add(tableId);
      return next;
    });
  }

  function rollTable(table: TableWithEntries) {
    if (rolling[table.id]) return;
    setRolling((prev) => ({ ...prev, [table.id]: true }));
    setRollResults((prev) => ({ ...prev, [table.id]: null }));

    setTimeout(() => {
      const sides = DICE_SIDES[table.dice_type];
      const rolled = Math.ceil(Math.random() * sides);
      const entry = table.entries.find((e) => e.roll_value === rolled);
      setRollResults((prev) => ({
        ...prev,
        [table.id]: {
          value: rolled,
          text: entry?.result_text ?? "（結果なし）",
        },
      }));
      setRolling((prev) => ({ ...prev, [table.id]: false }));
    }, 400);
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-center text-coc-muted">Supabase が設定されていません</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/scenarios/${scenarioId}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          シナリオに戻る
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <Dices size={22} className="text-coc-gold" />
        <h1 className="font-cinzel text-xl font-bold text-coc-text">カスタムランダム表</h1>
      </div>

      {loading ? (
        <p className="text-center text-coc-muted py-12">読み込み中...</p>
      ) : (
        <div className="space-y-4">
          {tables.length === 0 && !addingTable && (
            <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-10 text-center">
              <Dices size={32} className="text-coc-muted mx-auto mb-3" />
              <p className="text-sm text-coc-muted">まだランダム表が登録されていません</p>
              <p className="text-xs text-coc-muted mt-1">遭遇表・症状表など、シナリオ固有の表を作成できます</p>
            </div>
          )}

          {tables.map((table) => {
            const isExpanded = expandedIds.has(table.id);
            const result = rollResults[table.id];
            const isRolling = rolling[table.id] ?? false;

            return (
              <div key={table.id} className="rounded-xl border border-coc-border bg-coc-surface overflow-hidden">
                {/* table header */}
                <div className="flex items-center gap-3 px-5 py-4">
                  <button
                    onClick={() => toggleExpand(table.id)}
                    className="flex-1 flex items-center gap-3 text-left"
                  >
                    <span className="rounded-full border border-coc-gold-dim px-2 py-0.5 text-xs font-medium text-coc-gold font-cinzel">
                      {table.dice_type.toUpperCase()}
                    </span>
                    {editingTableId === table.id ? (
                      <input
                        autoFocus
                        value={editingTableName}
                        onChange={(e) => setEditingTableName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveTableName(table.id);
                          if (e.key === "Escape") setEditingTableId(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 rounded border border-coc-gold bg-coc-surface px-2 py-0.5 text-sm text-coc-text focus:outline-none"
                      />
                    ) : (
                      <span className="font-medium text-coc-text">{table.table_name}</span>
                    )}
                    {isExpanded ? (
                      <ChevronUp size={16} className="text-coc-muted ml-auto" />
                    ) : (
                      <ChevronDown size={16} className="text-coc-muted ml-auto" />
                    )}
                  </button>

                  {editingTableId === table.id ? (
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => saveTableName(table.id)}
                        className="p-1 rounded text-green-400 hover:bg-coc-raised transition-colors"
                      >
                        <Check size={15} />
                      </button>
                      <button
                        onClick={() => setEditingTableId(null)}
                        className="p-1 rounded text-coc-muted hover:bg-coc-raised transition-colors"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTableId(table.id);
                          setEditingTableName(table.table_name);
                        }}
                        className="p-1 rounded text-coc-muted hover:text-coc-text hover:bg-coc-raised transition-colors"
                        aria-label="名前を編集"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTable(table.id);
                        }}
                        className="p-1 rounded text-red-400 hover:bg-coc-raised transition-colors"
                        aria-label="削除"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {/* roll button + result */}
                <div className="px-5 pb-4 space-y-3">
                  <button
                    onClick={() => rollTable(table)}
                    disabled={isRolling}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-coc-gold bg-coc-gold/10 py-2.5 text-sm font-semibold text-coc-gold hover:bg-coc-gold/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Dices size={16} className={isRolling ? "animate-spin" : ""} />
                    {isRolling ? "ロール中..." : `ロール！（${table.dice_type.toUpperCase()}）`}
                  </button>

                  {result && (
                    <div className="rounded-xl border border-coc-gold bg-coc-raised px-5 py-3 flex items-center justify-between gap-4 animate-pulse-once">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-coc-muted mb-0.5">結果</p>
                        <p className="font-semibold text-coc-text">
                          {result.text || "（テキスト未設定）"}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-coc-muted mb-0.5">出目</p>
                        <p className="font-cinzel text-2xl font-bold text-coc-gold">{result.value}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* entries editor */}
                {isExpanded && (
                  <div className="border-t border-coc-border px-5 py-4 space-y-2">
                    <p className="text-xs text-coc-muted mb-3">各出目の結果テキストを編集できます</p>
                    {table.entries.map((entry) => {
                      const isHighlighted = result?.value === entry.roll_value;
                      const isEditingThis = editingEntryId === entry.id;

                      return (
                        <div
                          key={entry.id}
                          className={`flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${
                            isHighlighted
                              ? "border-coc-gold bg-coc-gold/10"
                              : "border-coc-border bg-coc-raised"
                          }`}
                        >
                          <span className="shrink-0 w-8 text-center font-cinzel text-sm font-bold text-coc-gold">
                            {entry.roll_value}
                          </span>
                          {isEditingThis ? (
                            <input
                              autoFocus
                              value={editingEntryText}
                              onChange={(e) => setEditingEntryText(e.target.value)}
                              onBlur={() => saveEntryText(entry, editingEntryText)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveEntryText(entry, editingEntryText);
                                if (e.key === "Escape") setEditingEntryId(null);
                              }}
                              className="flex-1 rounded border border-coc-gold bg-coc-surface px-2 py-0.5 text-sm text-coc-text focus:outline-none"
                              placeholder="結果テキストを入力"
                            />
                          ) : (
                            <button
                              onClick={() => {
                                setEditingEntryId(entry.id);
                                setEditingEntryText(entry.result_text);
                              }}
                              className="flex-1 text-left text-sm text-coc-text hover:text-coc-gold transition-colors truncate"
                            >
                              {entry.result_text || (
                                <span className="text-coc-muted italic">クリックして入力...</span>
                              )}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* add table form */}
          {addingTable ? (
            <div className="rounded-xl border border-coc-gold-dim bg-coc-raised px-5 py-4 space-y-3">
              <p className="text-sm font-medium text-coc-text">新しいランダム表を作成</p>
              <input
                type="text"
                placeholder="表の名前（例: 遭遇表、症状表）"
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                autoFocus
                className="w-full rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text placeholder-coc-muted focus:border-coc-gold focus:outline-none"
              />
              <div className="flex items-center gap-3">
                <label className="text-sm text-coc-muted shrink-0">ダイス</label>
                <div className="flex gap-2 flex-wrap">
                  {DICE_TYPES.map((d) => (
                    <button
                      key={d}
                      onClick={() => setNewDiceType(d)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium font-cinzel transition-colors ${
                        newDiceType === d
                          ? "border-coc-gold bg-coc-gold/10 text-coc-gold"
                          : "border-coc-border text-coc-muted hover:border-coc-gold hover:text-coc-gold"
                      }`}
                    >
                      {d.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-coc-muted">
                {DICE_SIDES[newDiceType]}マスの表が作成されます（1〜{DICE_SIDES[newDiceType]}）
              </p>
              <div className="flex gap-2">
                <button
                  onClick={createTable}
                  disabled={!newTableName.trim() || savingTable}
                  className="flex-1 rounded-lg bg-coc-gold py-2 text-sm font-medium text-black disabled:opacity-50 hover:opacity-90 transition-opacity"
                >
                  {savingTable ? "作成中..." : "作成"}
                </button>
                <button
                  onClick={() => {
                    setAddingTable(false);
                    setNewTableName("");
                    setNewDiceType("d6");
                  }}
                  className="rounded-lg border border-coc-border px-4 py-2 text-sm text-coc-muted hover:text-coc-text transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAddingTable(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-coc-border py-3 text-sm text-coc-muted hover:border-coc-gold hover:text-coc-gold transition-colors"
            >
              <Plus size={16} />
              ランダム表を追加
            </button>
          )}
        </div>
      )}
    </div>
  );
}
