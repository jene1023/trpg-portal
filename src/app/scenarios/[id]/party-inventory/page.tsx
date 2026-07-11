"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Package } from "lucide-react";
import { useParams } from "next/navigation";
import { supabase, isSupabaseConfigured, PartyInventoryItem, PartyInventoryItemType } from "@/lib/supabase";

type Participant = {
  character_id: string;
  characters: { id: string; name: string } | null;
};

type FormState = {
  name: string;
  item_type: PartyInventoryItemType;
  description: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  item_type: "item",
  description: "",
};

const ITEM_TYPE_LABELS: Record<PartyInventoryItemType, string> = {
  weapon: "武器",
  item: "アイテム",
  key_item: "重要アイテム",
};

export default function PartyInventoryPage() {
  const { id } = useParams<{ id: string }>();
  const [items, setItems] = useState<PartyInventoryItem[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    Promise.all([
      supabase
        .from("party_inventory")
        .select("*")
        .eq("scenario_id", id)
        .order("created_at", { ascending: true }),
      supabase
        .from("scenario_participants")
        .select("character_id, characters(id, name)")
        .eq("scenario_id", id),
    ]).then(([{ data: itemData }, { data: partData }]) => {
      setItems((itemData ?? []) as PartyInventoryItem[]);
      setParticipants((partData ?? []) as Participant[]);
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
      .from("party_inventory")
      .insert({
        scenario_id: id,
        name: form.name.trim(),
        item_type: form.item_type,
        description: form.description.trim() || null,
        current_holder_character_id: null,
      })
      .select()
      .single();
    setSaving(false);
    if (!error && data) {
      setItems((prev) => [...prev, data as PartyInventoryItem]);
      setForm(EMPTY_FORM);
      setOpen(false);
    }
  }

  async function updateHolder(itemId: string, holderId: string | null) {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase
      .from("party_inventory")
      .update({ current_holder_character_id: holderId })
      .eq("id", itemId);
    if (!error) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === itemId ? { ...i, current_holder_character_id: holderId } : i
        )
      );
    }
  }

  async function remove(itemId: string) {
    if (!isSupabaseConfigured) return;
    await supabase.from("party_inventory").delete().eq("id", itemId);
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  }

  const inputClass =
    "w-full rounded-md border border-coc-border bg-coc-void px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:outline-none focus:border-coc-gold";
  const labelClass = "block text-xs text-coc-muted mb-1";

  const unassigned = items.filter((i) => !i.current_holder_character_id);
  const assigned = items.filter((i) => !!i.current_holder_character_id);

  function getCharacterName(charId: string) {
    const p = participants.find((p) => p.character_id === charId);
    return p?.characters?.name ?? charId;
  }

  const holderIds = [...new Set(assigned.map((i) => i.current_holder_character_id as string))];

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
        <Package size={20} className="text-coc-gold" />
        <h1 className="font-cinzel text-xl font-bold text-coc-text">共有アイテム庫</h1>
      </div>
      <p className="text-xs text-coc-muted mb-6">
        鍵・地図・共用武器などパーティー共有アイテムを一元管理。所持者を割り当てて受け渡しを記録できます。
      </p>

      {loading ? (
        <p className="text-sm text-coc-muted text-center py-8">読み込み中…</p>
      ) : (
        <div className="space-y-6">
          {/* 共有庫セクション（未割当） */}
          <div>
            <h2 className="font-cinzel text-xs font-semibold text-coc-muted uppercase tracking-widest mb-2">
              共有庫（未割当）
            </h2>
            {unassigned.length === 0 && (
              <p className="text-sm text-coc-muted text-center py-3 rounded-lg border border-dashed border-coc-border">
                未割当のアイテムなし
              </p>
            )}
            <div className="space-y-2">
              {unassigned.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  participants={participants}
                  onUpdateHolder={updateHolder}
                  onRemove={remove}
                />
              ))}
            </div>
          </div>

          {/* 所持者別セクション */}
          {holderIds.length > 0 && (
            <div className="space-y-4">
              {holderIds.map((holderId) => (
                <div key={holderId}>
                  <h2 className="font-cinzel text-xs font-semibold text-coc-gold uppercase tracking-widest mb-2">
                    {getCharacterName(holderId)}
                  </h2>
                  <div className="space-y-2">
                    {assigned
                      .filter((i) => i.current_holder_character_id === holderId)
                      .map((item) => (
                        <ItemCard
                          key={item.id}
                          item={item}
                          participants={participants}
                          onUpdateHolder={updateHolder}
                          onRemove={remove}
                        />
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}

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
                  {(["weapon", "item", "key_item"] as PartyInventoryItemType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => change("item_type", t)}
                      className={`flex-1 rounded-md border py-1.5 text-xs transition-colors ${
                        form.item_type === t
                          ? "border-coc-gold text-coc-gold bg-coc-gold/10"
                          : "border-coc-border text-coc-muted hover:border-coc-border"
                      }`}
                    >
                      {ITEM_TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>名前 *</label>
                <input
                  type="text"
                  required
                  placeholder="例: 金庫の鍵"
                  value={form.name}
                  onChange={(e) => change("name", e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>説明</label>
                <input
                  type="text"
                  placeholder="例: 地下室への入口の鍵"
                  value={form.description}
                  onChange={(e) => change("description", e.target.value)}
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

type ItemCardProps = {
  item: PartyInventoryItem;
  participants: Participant[];
  onUpdateHolder: (itemId: string, holderId: string | null) => void;
  onRemove: (itemId: string) => void;
};

function ItemCard({ item, participants, onUpdateHolder, onRemove }: ItemCardProps) {
  const ITEM_TYPE_BADGES: Record<PartyInventoryItemType, string> = {
    weapon: "text-red-400 border-red-900 bg-red-950/30",
    item: "text-blue-400 border-blue-900 bg-blue-950/30",
    key_item: "text-yellow-400 border-yellow-800 bg-yellow-950/30",
  };

  return (
    <div className="rounded-lg border border-coc-border bg-coc-surface p-3">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-coc-text">{item.name}</p>
            <span
              className={`rounded-full border px-2 py-0.5 text-xs ${ITEM_TYPE_BADGES[item.item_type]}`}
            >
              {ITEM_TYPE_LABELS[item.item_type]}
            </span>
          </div>
          {item.description && (
            <p className="text-xs text-coc-muted mt-0.5 whitespace-pre-wrap">{item.description}</p>
          )}
          <div className="mt-2">
            <select
              value={item.current_holder_character_id ?? ""}
              onChange={(e) => onUpdateHolder(item.id, e.target.value || null)}
              className="rounded-md border border-coc-border bg-coc-void px-2 py-1 text-xs text-coc-text focus:outline-none focus:border-coc-gold"
            >
              <option value="">共有庫（未割当）</option>
              {participants.map((p) => (
                <option key={p.character_id} value={p.character_id}>
                  {p.characters?.name ?? p.character_id}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={() => onRemove(item.id)}
          className="shrink-0 text-coc-muted hover:text-red-400 text-xs transition-colors"
        >
          削除
        </button>
      </div>
    </div>
  );
}
