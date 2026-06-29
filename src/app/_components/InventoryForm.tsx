"use client";

import { useState } from "react";
import { supabase, isSupabaseConfigured, InventoryItem, ItemType } from "@/lib/supabase";

type Props = {
  characterId: string;
  initialItems: InventoryItem[];
};

type FormState = {
  item_type: ItemType;
  name: string;
  damage: string;
  range: string;
  ammo_current: string;
  ammo_max: string;
  notes: string;
};

const EMPTY_FORM: FormState = {
  item_type: "weapon",
  name: "",
  damage: "",
  range: "",
  ammo_current: "",
  ammo_max: "",
  notes: "",
};

export default function InventoryForm({ characterId, initialItems }: Props) {
  const [items, setItems] = useState<InventoryItem[]>(initialItems);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  function change(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (!isSupabaseConfigured) return;

    setSaving(true);
    const { data, error } = await supabase
      .from("inventory_items")
      .insert({
        character_id: characterId,
        item_type: form.item_type,
        name: form.name.trim(),
        damage: form.item_type === "weapon" && form.damage.trim() ? form.damage.trim() : null,
        range: form.item_type === "weapon" && form.range.trim() ? form.range.trim() : null,
        ammo_current: form.item_type === "weapon" && form.ammo_current !== "" ? parseInt(form.ammo_current) || null : null,
        ammo_max: form.item_type === "weapon" && form.ammo_max !== "" ? parseInt(form.ammo_max) || null : null,
        notes: form.notes.trim() || null,
      })
      .select()
      .single();
    setSaving(false);

    if (!error && data) {
      setItems((prev) => [...prev, data as InventoryItem]);
      setForm(EMPTY_FORM);
      setOpen(false);
    }
  }

  async function remove(id: string) {
    if (!isSupabaseConfigured) return;
    await supabase.from("inventory_items").delete().eq("id", id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  const weapons = items.filter((i) => i.item_type === "weapon");
  const others = items.filter((i) => i.item_type === "item");

  const inputClass =
    "w-full rounded-md border border-coc-border bg-coc-void px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:outline-none focus:border-coc-gold";
  const labelClass = "block text-xs text-coc-muted mb-1";
  const sectionTitle = "font-cinzel text-xs font-semibold text-coc-muted uppercase tracking-widest mb-2";

  return (
    <div className="space-y-6">
      {/* 武器セクション */}
      <div>
        <h2 className={sectionTitle}>武器</h2>
        {weapons.length === 0 && (
          <p className="text-sm text-coc-muted text-center py-3">武器なし</p>
        )}
        <div className="space-y-2">
          {weapons.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-coc-border bg-coc-surface p-3 flex gap-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-coc-text">{item.name}</p>
                <div className="flex flex-wrap gap-3 mt-1">
                  {item.damage && (
                    <span className="text-xs text-coc-muted">
                      ダメージ: <span className="text-coc-text">{item.damage}</span>
                    </span>
                  )}
                  {item.range && (
                    <span className="text-xs text-coc-muted">
                      射程: <span className="text-coc-text">{item.range}</span>
                    </span>
                  )}
                  {item.ammo_max != null && (
                    <span className="text-xs text-coc-muted">
                      弾薬: <span className="text-coc-text">{item.ammo_current ?? "?"}/{item.ammo_max}</span>
                    </span>
                  )}
                </div>
                {item.notes && (
                  <p className="text-xs text-coc-muted mt-1 whitespace-pre-wrap">{item.notes}</p>
                )}
              </div>
              <button
                onClick={() => remove(item.id)}
                className="shrink-0 text-coc-muted hover:text-red-400 text-xs transition-colors"
              >
                削除
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 一般アイテムセクション */}
      <div>
        <h2 className={sectionTitle}>所持品・アイテム</h2>
        {others.length === 0 && (
          <p className="text-sm text-coc-muted text-center py-3">所持品なし</p>
        )}
        <div className="space-y-2">
          {others.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-coc-border bg-coc-surface p-3 flex gap-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-coc-text">{item.name}</p>
                {item.notes && (
                  <p className="text-xs text-coc-muted mt-1 whitespace-pre-wrap">{item.notes}</p>
                )}
              </div>
              <button
                onClick={() => remove(item.id)}
                className="shrink-0 text-coc-muted hover:text-red-400 text-xs transition-colors"
              >
                削除
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 追加フォーム */}
      {open ? (
        <form
          onSubmit={submit}
          className="rounded-lg border border-coc-border bg-coc-surface p-4 space-y-3"
        >
          <h3 className="font-cinzel text-sm font-semibold text-coc-gold tracking-widest">
            アイテムを追加
          </h3>

          <div>
            <label className={labelClass}>種別</label>
            <div className="flex gap-2">
              {(["weapon", "item"] as ItemType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => change("item_type", t)}
                  className={`flex-1 rounded-md border py-1.5 text-sm transition-colors ${
                    form.item_type === t
                      ? "border-coc-gold text-coc-gold bg-coc-gold/10"
                      : "border-coc-border text-coc-muted hover:border-coc-border-glow"
                  }`}
                >
                  {t === "weapon" ? "武器" : "アイテム"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>名前 *</label>
            <input
              type="text"
              required
              placeholder={form.item_type === "weapon" ? "例: .45オート" : "例: 懐中電灯"}
              value={form.name}
              onChange={(e) => change("name", e.target.value)}
              className={inputClass}
            />
          </div>

          {form.item_type === "weapon" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>ダメージ</label>
                  <input
                    type="text"
                    placeholder="例: 1D10+2"
                    value={form.damage}
                    onChange={(e) => change("damage", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>射程</label>
                  <input
                    type="text"
                    placeholder="例: 15m"
                    value={form.range}
                    onChange={(e) => change("range", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>弾薬（現在）</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="例: 7"
                    value={form.ammo_current}
                    onChange={(e) => change("ammo_current", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>弾薬（最大）</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="例: 7"
                    value={form.ammo_max}
                    onChange={(e) => change("ammo_max", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className={labelClass}>メモ</label>
            <input
              type="text"
              placeholder="例: 父の形見のリボルバー"
              value={form.notes}
              onChange={(e) => change("notes", e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={saving || !form.name.trim()}
              className="flex-1 rounded-lg bg-coc-gold text-black font-semibold text-sm py-2 disabled:opacity-40 hover:brightness-110 transition-all"
            >
              {saving ? "保存中…" : "追加する"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 rounded-lg border border-coc-border text-coc-muted hover:text-coc-text text-sm transition-colors"
            >
              キャンセル
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="w-full rounded-lg border border-dashed border-coc-border text-coc-muted hover:text-coc-text hover:border-coc-border-glow py-3 text-sm transition-colors"
        >
          ＋ アイテムを追加
        </button>
      )}
    </div>
  );
}
