"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Archive } from "lucide-react";
import { useParams } from "next/navigation";
import { supabase, isSupabaseConfigured, ScenarioSharedItem, ItemType } from "@/lib/supabase";

type FormState = {
  name: string;
  item_type: ItemType;
  damage: string;
  notes: string;
  added_by: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  item_type: "item",
  damage: "",
  notes: "",
  added_by: "",
};

export default function SharedInventoryPage() {
  const { id } = useParams<{ id: string }>();
  const [items, setItems] = useState<ScenarioSharedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    supabase
      .from("scenario_shared_items")
      .select("*")
      .eq("scenario_id", id)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setItems((data ?? []) as ScenarioSharedItem[]);
        setLoading(false);
      });
  }, [id]);

  function change(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !isSupabaseConfigured) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("scenario_shared_items")
      .insert({
        scenario_id: id,
        name: form.name.trim(),
        item_type: form.item_type,
        damage: form.item_type === "weapon" && form.damage.trim() ? form.damage.trim() : null,
        notes: form.notes.trim() || null,
        added_by: form.added_by.trim() || null,
      })
      .select()
      .single();
    setSaving(false);
    if (!error && data) {
      setItems((prev) => [...prev, data as ScenarioSharedItem]);
      setForm(EMPTY_FORM);
      setOpen(false);
    }
  }

  async function remove(itemId: string) {
    if (!isSupabaseConfigured) return;
    await supabase.from("scenario_shared_items").delete().eq("id", itemId);
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  }

  const inputClass =
    "w-full rounded-md border border-coc-border bg-coc-void px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:outline-none focus:border-coc-gold";
  const labelClass = "block text-xs text-coc-muted mb-1";

  const weapons = items.filter((i) => i.item_type === "weapon");
  const others = items.filter((i) => i.item_type === "item");

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/scenarios/${id}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          シナリオ詳細
        </Link>
      </div>

      <div className="flex items-center gap-2 mb-1">
        <Archive size={20} className="text-coc-gold" />
        <h1 className="font-cinzel text-xl font-bold text-coc-text">共有装備BOX</h1>
      </div>
      <p className="text-xs text-coc-muted mb-6">
        パーティー全員がアクセスできる共有ストレージ。予備弾薬・医療品・情報メモなどを出し入れします。
      </p>

      {loading ? (
        <p className="text-sm text-coc-muted text-center py-8">読み込み中…</p>
      ) : (
        <div className="space-y-6">
          {/* 武器セクション */}
          <div>
            <h2 className="font-cinzel text-xs font-semibold text-coc-muted uppercase tracking-widest mb-2">武器</h2>
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
                      {item.added_by && (
                        <span className="text-xs text-coc-muted">追加者: {item.added_by}</span>
                      )}
                    </div>
                    {item.notes && (
                      <p className="text-xs text-coc-muted mt-1 whitespace-pre-wrap">{item.notes}</p>
                    )}
                  </div>
                  <button
                    onClick={() => remove(item.id)}
                    className="shrink-0 text-coc-muted hover:text-red-400 text-xs transition-colors self-start"
                  >
                    削除
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* アイテムセクション */}
          <div>
            <h2 className="font-cinzel text-xs font-semibold text-coc-muted uppercase tracking-widest mb-2">所持品・アイテム</h2>
            {others.length === 0 && (
              <p className="text-sm text-coc-muted text-center py-3">アイテムなし</p>
            )}
            <div className="space-y-2">
              {others.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-coc-border bg-coc-surface p-3 flex gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-coc-text">{item.name}</p>
                    {item.added_by && (
                      <p className="text-xs text-coc-muted mt-0.5">追加者: {item.added_by}</p>
                    )}
                    {item.notes && (
                      <p className="text-xs text-coc-muted mt-1 whitespace-pre-wrap">{item.notes}</p>
                    )}
                  </div>
                  <button
                    onClick={() => remove(item.id)}
                    className="shrink-0 text-coc-muted hover:text-red-400 text-xs transition-colors self-start"
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
                          : "border-coc-border text-coc-muted hover:border-coc-border"
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
                  placeholder={form.item_type === "weapon" ? "例: .45オート" : "例: 医療キット"}
                  value={form.name}
                  onChange={(e) => change("name", e.target.value)}
                  className={inputClass}
                />
              </div>

              {form.item_type === "weapon" && (
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
              )}

              <div>
                <label className={labelClass}>メモ</label>
                <input
                  type="text"
                  placeholder="例: 予備弾薬3本入り"
                  value={form.notes}
                  onChange={(e) => change("notes", e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>追加者</label>
                <input
                  type="text"
                  placeholder="例: 田中PL"
                  value={form.added_by}
                  onChange={(e) => change("added_by", e.target.value)}
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
              className="w-full rounded-lg border border-dashed border-coc-border text-coc-muted hover:text-coc-text py-3 text-sm transition-colors"
            >
              ＋ アイテムを追加
            </button>
          )}
        </div>
      )}
    </div>
  );
}
