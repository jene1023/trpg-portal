"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Trash2, ChevronRight } from "lucide-react";
import { supabase, isSupabaseConfigured, RandomTable, DiceType } from "@/lib/supabase";

const DICE_TYPES: DiceType[] = ["d6", "d8", "d10", "d12", "d20", "d100"];

type Props = {
  initialTables: RandomTable[];
};

export default function RandomTableList({ initialTables }: Props) {
  const [tables, setTables] = useState<RandomTable[]>(initialTables);
  const [name, setName] = useState("");
  const [diceType, setDiceType] = useState<DiceType>("d20");
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  async function addTable() {
    if (!name.trim() || !isSupabaseConfigured) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("random_tables")
      .insert({ name: name.trim(), dice_type: diceType })
      .select()
      .single();
    if (!error && data) {
      setTables((prev) => [data as RandomTable, ...prev]);
      setName("");
      setDiceType("d20");
      setAdding(false);
    }
    setSaving(false);
  }

  async function deleteTable(id: string) {
    if (!isSupabaseConfigured) return;
    await supabase.from("random_tables").delete().eq("id", id);
    setTables((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {tables.map((table) => (
          <div
            key={table.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold/40 transition-colors"
          >
            <Link
              href={`/random-tables/${table.id}`}
              className="flex-1 min-w-0 flex items-center gap-3 group"
            >
              <span className="shrink-0 rounded-full bg-coc-gold/20 px-2 py-0.5 text-xs font-bold text-coc-gold uppercase">
                {table.dice_type}
              </span>
              <span className="font-medium text-coc-text group-hover:text-coc-gold transition-colors truncate">
                {table.name}
              </span>
              <ChevronRight size={16} className="shrink-0 text-coc-muted group-hover:text-coc-gold transition-colors" />
            </Link>
            <button
              onClick={() => deleteTable(table.id)}
              className="shrink-0 p-1 rounded hover:bg-coc-raised text-red-400 transition-colors"
              aria-label="削除"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      {tables.length === 0 && !adding && (
        <p className="text-center text-sm text-coc-muted py-8">ランダム表がまだ登録されていません</p>
      )}

      {adding ? (
        <div className="rounded-xl border border-coc-gold-dim bg-coc-raised px-5 py-4 space-y-3">
          <input
            type="text"
            placeholder="表の名前（例: 邂逅する怪異の容貌、戦利品種別）"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text placeholder-coc-muted focus:border-coc-gold focus:outline-none"
            autoFocus
          />
          <div className="flex items-center gap-3">
            <label className="text-sm text-coc-muted shrink-0">ダイス種別</label>
            <div className="flex flex-wrap gap-2">
              {DICE_TYPES.map((d) => (
                <button
                  key={d}
                  onClick={() => setDiceType(d)}
                  className={`rounded-full px-3 py-1 text-xs font-bold uppercase transition-colors ${
                    diceType === d
                      ? "bg-coc-gold text-black"
                      : "border border-coc-border text-coc-muted hover:border-coc-gold hover:text-coc-gold"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={addTable}
              disabled={!name.trim() || saving}
              className="flex-1 rounded-lg bg-coc-gold py-2 text-sm font-medium text-black disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              {saving ? "保存中..." : "作成"}
            </button>
            <button
              onClick={() => {
                setAdding(false);
                setName("");
                setDiceType("d20");
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
          ランダム表を作成
        </button>
      )}
    </div>
  );
}
