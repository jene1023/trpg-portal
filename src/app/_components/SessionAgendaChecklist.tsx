"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Trash2, ChevronUp, ChevronDown, Plus } from "lucide-react";
import { supabase, isSupabaseConfigured, SessionAgendaItem, SessionAgendaItemType } from "@/lib/supabase";

type Props = {
  scenarioId: string;
  initialItems: SessionAgendaItem[];
};

const ITEM_TYPE_LABELS: Record<SessionAgendaItemType, string> = {
  scene: "場面",
  handout: "ハンドアウト",
  npc: "NPC",
  note: "メモ",
};

const ITEM_TYPE_COLORS: Record<SessionAgendaItemType, string> = {
  scene: "text-blue-400",
  handout: "text-yellow-400",
  npc: "text-green-400",
  note: "text-coc-muted",
};

export default function SessionAgendaChecklist({ scenarioId, initialItems }: Props) {
  const [items, setItems] = useState<SessionAgendaItem[]>(initialItems);
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [itemType, setItemType] = useState<SessionAgendaItemType>("scene");
  const [saving, setSaving] = useState(false);

  async function addItem() {
    if (!label.trim() || !isSupabaseConfigured) return;
    setSaving(true);
    const maxOrder = items.length > 0 ? Math.max(...items.map((i) => i.order_index)) : -1;
    const { data, error } = await supabase
      .from("session_agenda_items")
      .insert({
        scenario_id: scenarioId,
        item_type: itemType,
        label: label.trim(),
        is_done: false,
        order_index: maxOrder + 1,
      })
      .select()
      .single();
    if (!error && data) {
      setItems((prev) => [...prev, data as SessionAgendaItem]);
      setLabel("");
      setAdding(false);
    }
    setSaving(false);
  }

  async function toggleDone(id: string, current: boolean) {
    if (!isSupabaseConfigured) return;
    await supabase.from("session_agenda_items").update({ is_done: !current }).eq("id", id);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, is_done: !current } : i)));
  }

  async function deleteItem(id: string) {
    if (!isSupabaseConfigured) return;
    await supabase.from("session_agenda_items").delete().eq("id", id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  async function moveItem(index: number, direction: -1 | 1) {
    if (!isSupabaseConfigured) return;
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= items.length) return;
    const updated = [...items];
    const aOrder = updated[index].order_index;
    const bOrder = updated[swapIndex].order_index;
    await Promise.all([
      supabase.from("session_agenda_items").update({ order_index: bOrder }).eq("id", updated[index].id),
      supabase.from("session_agenda_items").update({ order_index: aOrder }).eq("id", updated[swapIndex].id),
    ]);
    updated[index] = { ...updated[index], order_index: bOrder };
    updated[swapIndex] = { ...updated[swapIndex], order_index: aOrder };
    updated.sort((a, b) => a.order_index - b.order_index);
    setItems(updated);
  }

  const doneCount = items.filter((i) => i.is_done).length;

  return (
    <div className="space-y-3">
      {items.length > 0 && (
        <p className="text-xs text-coc-muted">
          {doneCount} / {items.length} 完了
        </p>
      )}

      {items.map((item, i) => (
        <div
          key={item.id}
          className={`rounded-xl border bg-coc-surface overflow-hidden transition-opacity ${
            item.is_done ? "opacity-60" : ""
          } border-coc-border`}
        >
          <div className="flex items-center justify-between px-4 py-3 gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <button
                onClick={() => toggleDone(item.id, item.is_done)}
                className="shrink-0 text-coc-muted hover:text-coc-gold transition-colors"
                aria-label={item.is_done ? "未完了に戻す" : "完了にする"}
              >
                {item.is_done ? (
                  <CheckCircle2 size={18} className="text-green-400" />
                ) : (
                  <Circle size={18} />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs shrink-0 font-medium ${
                      ITEM_TYPE_COLORS[item.item_type as SessionAgendaItemType]
                    }`}
                  >
                    {ITEM_TYPE_LABELS[item.item_type as SessionAgendaItemType]}
                  </span>
                  <span
                    className={`text-sm truncate ${
                      item.is_done ? "line-through text-coc-muted" : "text-coc-text"
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => moveItem(i, -1)}
                disabled={i === 0}
                className="p-1 rounded hover:bg-coc-raised text-coc-muted disabled:opacity-30 transition-colors"
                aria-label="上へ"
              >
                <ChevronUp size={16} />
              </button>
              <button
                onClick={() => moveItem(i, 1)}
                disabled={i === items.length - 1}
                className="p-1 rounded hover:bg-coc-raised text-coc-muted disabled:opacity-30 transition-colors"
                aria-label="下へ"
              >
                <ChevronDown size={16} />
              </button>
              <button
                onClick={() => deleteItem(item.id)}
                className="p-1 rounded hover:bg-coc-raised text-red-400 transition-colors"
                aria-label="削除"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        </div>
      ))}

      {items.length === 0 && !adding && (
        <p className="text-center text-sm text-coc-muted py-6">
          チェックリストが空です。セッション当日の「やること」を追加しましょう。
        </p>
      )}

      {adding ? (
        <div className="rounded-xl border border-coc-gold-dim bg-coc-raised px-5 py-4 space-y-3">
          <div className="flex gap-2">
            <select
              value={itemType}
              onChange={(e) => setItemType(e.target.value as SessionAgendaItemType)}
              className="rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text focus:border-coc-gold focus:outline-none"
            >
              <option value="scene">場面</option>
              <option value="handout">ハンドアウト</option>
              <option value="npc">NPC</option>
              <option value="note">メモ</option>
            </select>
            <input
              type="text"
              placeholder="内容（例: 導入シーン、ハンドアウトA配布、田中博士登場）"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addItem()}
              className="flex-1 rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text placeholder-coc-muted focus:border-coc-gold focus:outline-none"
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={addItem}
              disabled={!label.trim() || saving}
              className="flex-1 rounded-lg bg-coc-gold py-2 text-sm font-medium text-black disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              {saving ? "追加中..." : "追加"}
            </button>
            <button
              onClick={() => {
                setAdding(false);
                setLabel("");
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
          項目を追加
        </button>
      )}
    </div>
  );
}
