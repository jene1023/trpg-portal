"use client";

import { useState, useEffect } from "react";
import { Plus, X, Check } from "lucide-react";
import { supabase, isSupabaseConfigured, ItemCatalog } from "@/lib/supabase";

type Character = { id: string; name: string; occupation: string | null };

type Props = { item: ItemCatalog };

export default function ItemCatalogAddButton({ item }: Props) {
  const [open, setOpen] = useState(false);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open || !isSupabaseConfigured) return;
    supabase
      .from("characters")
      .select("id, name, occupation")
      .order("name", { ascending: true })
      .then(({ data }) => setCharacters((data as Character[]) ?? []));
  }, [open]);

  async function addToInventory() {
    if (!selectedId || !isSupabaseConfigured) return;
    setSaving(true);
    await supabase.from("inventory_items").insert({
      character_id: selectedId,
      item_type: item.category === "weapon" ? "weapon" : "item",
      name: item.name,
      damage: item.damage ?? null,
      range: null,
      ammo_current: null,
      ammo_max: null,
      notes: item.notes ?? null,
    });
    setSaving(false);
    setDone(true);
    setTimeout(() => {
      setOpen(false);
      setDone(false);
      setSelectedId("");
    }, 800);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="shrink-0 rounded border border-coc-border px-2 py-1 text-xs text-coc-muted hover:text-coc-gold hover:border-coc-gold transition-colors flex items-center gap-1"
        title="インベントリに追加"
      >
        <Plus size={12} />
        追加
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-xl border border-coc-border bg-coc-surface shadow-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-cinzel text-sm font-semibold text-coc-gold tracking-wide">
                インベントリに追加
              </h3>
              <button
                onClick={() => { setOpen(false); setSelectedId(""); setDone(false); }}
                className="text-coc-muted hover:text-coc-text transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-sm text-coc-text mb-1 font-medium">{item.name}</p>
            {item.damage && (
              <p className="text-xs text-coc-muted mb-3">ダメージ: {item.damage}</p>
            )}

            <label className="block text-xs text-coc-muted mb-1">追加先キャラクター</label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full rounded-md border border-coc-border bg-coc-void px-3 py-2 text-sm text-coc-text focus:outline-none focus:border-coc-gold mb-4"
            >
              <option value="">選択してください</option>
              {characters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.occupation ? `（${c.occupation}）` : ""}
                </option>
              ))}
            </select>

            {done ? (
              <div className="flex items-center justify-center gap-2 py-2 text-green-400 text-sm">
                <Check size={16} />
                追加しました
              </div>
            ) : (
              <button
                onClick={addToInventory}
                disabled={!selectedId || saving}
                className="w-full rounded-lg bg-coc-gold text-black font-semibold text-sm py-2 disabled:opacity-40 hover:brightness-110 transition-all"
              >
                {saving ? "追加中…" : "インベントリへ追加"}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
