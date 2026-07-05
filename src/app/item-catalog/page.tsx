"use client";

/*
 * SQL seed data for item_catalog table:
 *
 * INSERT INTO item_catalog (category, name, damage, notes) VALUES
 *   ('weapon', '.45オートM1911', '1D10+2', '射程15m、装弾7+1'),
 *   ('weapon', '.38リボルバー', '1D10', '射程15m、装弾6'),
 *   ('weapon', '12ゲージ散弾銃', '4D6/2D6/1D6', '射程50m、装弾2'),
 *   ('weapon', 'ライフル（ボルトアクション）', '2D6+4', '射程110m、装弾5'),
 *   ('weapon', 'ナイフ', '1D4+db', ''),
 *   ('weapon', 'こぶし', '1D3+db', ''),
 *   ('weapon', 'ショットガン（ポンプアクション）', '4D6/2D6/1D6', '射程50m、装弾5'),
 *   ('medical', '包帯', NULL, '1D3 HP回復'),
 *   ('medical', '応急処置キット', NULL, '応急処置技能使用可。1回分'),
 *   ('medical', '鎮痛剤', NULL, 'CON/5以下で1D3時間、痛みを抑制'),
 *   ('medical', '強心剤', NULL, '気絶中キャラクターを覚醒させる'),
 *   ('tool', '懐中電灯', NULL, '電池1D6時間分'),
 *   ('tool', '双眼鏡', NULL, '目星ボーナス1'),
 *   ('tool', 'カメラ（フィルム）', NULL, '証拠収集に使用'),
 *   ('tool', 'ロープ（20m）', NULL, ''),
 *   ('tool', '手錠', NULL, ''),
 *   ('misc', 'タバコとライター', NULL, '交渉小道具'),
 *   ('misc', '聖典（コーラン等）', NULL, 'SANロール修正：状況による'),
 *   ('misc', 'お守り・護符', NULL, 'セッション開始時、+1 SAN効果（任意）');
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, BookMarked } from "lucide-react";
import {
  supabase,
  isSupabaseConfigured,
  ItemCatalog,
  ItemCatalogCategory,
} from "@/lib/supabase";
import ItemCatalogAddButton from "@/app/_components/ItemCatalogAddButton";

const CATEGORIES: { value: ItemCatalogCategory | "all"; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "weapon", label: "武器" },
  { value: "medical", label: "医薬品" },
  { value: "tool", label: "道具" },
  { value: "misc", label: "その他" },
];

const CATEGORY_LABEL: Record<ItemCatalogCategory, string> = {
  weapon: "武器",
  medical: "医薬品",
  tool: "道具",
  misc: "その他",
};

const CATEGORY_COLOR: Record<ItemCatalogCategory, string> = {
  weapon: "text-red-400 border-red-700 bg-red-900/20",
  medical: "text-green-400 border-green-700 bg-green-900/20",
  tool: "text-blue-400 border-blue-700 bg-blue-900/20",
  misc: "text-coc-muted border-coc-border bg-coc-surface",
};

type FormState = {
  category: ItemCatalogCategory;
  name: string;
  damage: string;
  notes: string;
};

const EMPTY_FORM: FormState = {
  category: "weapon",
  name: "",
  damage: "",
  notes: "",
};

export default function ItemCatalogPage() {
  const [items, setItems] = useState<ItemCatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<ItemCatalogCategory | "all">("all");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    supabase
      .from("item_catalog")
      .select("*")
      .order("category", { ascending: true })
      .order("name", { ascending: true })
      .then(({ data }) => {
        setItems((data as ItemCatalog[]) ?? []);
        setLoading(false);
      });
  }, []);

  function change(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !isSupabaseConfigured) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("item_catalog")
      .insert({
        category: form.category,
        name: form.name.trim(),
        damage: form.category === "weapon" && form.damage.trim() ? form.damage.trim() : null,
        notes: form.notes.trim() || null,
      })
      .select()
      .single();
    setSaving(false);
    if (!error && data) {
      setItems((prev) =>
        [...prev, data as ItemCatalog].sort((a, b) =>
          a.category.localeCompare(b.category) || a.name.localeCompare(b.name, "ja")
        )
      );
      setForm(EMPTY_FORM);
      setFormOpen(false);
    }
  }

  async function remove(id: string) {
    if (!isSupabaseConfigured) return;
    await supabase.from("item_catalog").delete().eq("id", id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  const filtered =
    categoryFilter === "all"
      ? items
      : items.filter((i) => i.category === categoryFilter);

  const inputClass =
    "w-full rounded-md border border-coc-border bg-coc-void px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:outline-none focus:border-coc-gold";
  const labelClass = "block text-xs text-coc-muted mb-1";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          ホーム
        </Link>
      </div>

      <div className="flex items-center gap-2 mb-1">
        <BookMarked size={20} className="text-coc-gold" />
        <h1 className="font-cinzel text-xl font-bold text-coc-text">アイテムカタログ</h1>
      </div>
      <p className="text-sm text-coc-muted mb-6">
        よく使う武器・アイテムのテンプレートを管理します。インベントリ追加時にワンクリックで選択できます。
      </p>

      {/* カテゴリフィルタ */}
      <div className="flex flex-wrap gap-2 mb-5">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setCategoryFilter(c.value)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              categoryFilter === c.value
                ? "border-coc-gold text-coc-gold bg-coc-gold/10"
                : "border-coc-border text-coc-muted hover:border-coc-gold hover:text-coc-gold"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* アイテム一覧 */}
      {loading ? (
        <p className="text-sm text-coc-muted text-center py-8">読み込み中…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-coc-muted text-center py-8">
          {categoryFilter === "all" ? "カタログが空です。アイテムを追加してください。" : "このカテゴリにアイテムがありません。"}
        </p>
      ) : (
        <div className="space-y-2 mb-6">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-coc-border bg-coc-surface p-3 flex gap-3 items-start"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-coc-text">{item.name}</p>
                  <span
                    className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${CATEGORY_COLOR[item.category]}`}
                  >
                    {CATEGORY_LABEL[item.category]}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 mt-1">
                  {item.damage && (
                    <span className="text-xs text-coc-muted">
                      ダメージ: <span className="text-coc-text">{item.damage}</span>
                    </span>
                  )}
                  {item.notes && (
                    <span className="text-xs text-coc-muted">{item.notes}</span>
                  )}
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                <ItemCatalogAddButton item={item} />
                <button
                  onClick={() => remove(item.id)}
                  className="text-coc-muted hover:text-red-400 transition-colors"
                  title="削除"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 追加フォーム */}
      {formOpen ? (
        <form
          onSubmit={submit}
          className="rounded-lg border border-coc-border bg-coc-surface p-4 space-y-3"
        >
          <h3 className="font-cinzel text-sm font-semibold text-coc-gold tracking-widest">
            カタログに追加
          </h3>

          <div>
            <label className={labelClass}>カテゴリ</label>
            <select
              value={form.category}
              onChange={(e) => change("category", e.target.value)}
              className={inputClass}
            >
              {CATEGORIES.filter((c) => c.value !== "all").map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>名前 *</label>
            <input
              type="text"
              required
              placeholder={form.category === "weapon" ? "例: .45オートM1911" : "例: 包帯"}
              value={form.name}
              onChange={(e) => change("name", e.target.value)}
              className={inputClass}
            />
          </div>

          {form.category === "weapon" && (
            <div>
              <label className={labelClass}>ダメージ式</label>
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
              placeholder="例: 射程15m、装弾7+1"
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
              onClick={() => setFormOpen(false)}
              className="px-4 rounded-lg border border-coc-border text-coc-muted hover:text-coc-text text-sm transition-colors"
            >
              キャンセル
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setFormOpen(true)}
          className="w-full rounded-lg border border-dashed border-coc-border text-coc-muted hover:text-coc-text hover:border-coc-border-glow py-3 text-sm transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={15} />
          カタログにアイテムを追加
        </button>
      )}
    </div>
  );
}
