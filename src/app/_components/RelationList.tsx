"use client";

import { useState } from "react";
import { supabase, isSupabaseConfigured, CharacterRelation, RelationType } from "@/lib/supabase";

const RELATION_TYPES: RelationType[] = ["友人", "ライバル", "恩人", "要注意", "その他"];

const RELATION_COLORS: Record<RelationType, string> = {
  友人: "text-green-400 border-green-700",
  ライバル: "text-blue-400 border-blue-700",
  恩人: "text-coc-gold border-coc-gold-dim",
  要注意: "text-red-400 border-red-700",
  その他: "text-coc-muted border-coc-border",
};

type Props = {
  characterId: string;
  initialRelations: CharacterRelation[];
};

export default function RelationList({ characterId, initialRelations }: Props) {
  const [relations, setRelations] = useState<CharacterRelation[]>(initialRelations);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    target_name: "",
    relation_type: "友人" as RelationType,
    memo: "",
  });

  function change(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.target_name.trim()) return;
    if (!isSupabaseConfigured) return;

    setSaving(true);
    const { data, error } = await supabase
      .from("character_relations")
      .insert({
        character_id: characterId,
        target_name: form.target_name.trim(),
        relation_type: form.relation_type,
        memo: form.memo.trim() || null,
      })
      .select()
      .single();
    setSaving(false);

    if (!error && data) {
      setRelations((prev) => [data as CharacterRelation, ...prev]);
      setForm({ target_name: "", relation_type: "友人", memo: "" });
      setOpen(false);
    }
  }

  async function remove(id: string) {
    if (!isSupabaseConfigured) return;
    await supabase.from("character_relations").delete().eq("id", id);
    setRelations((prev) => prev.filter((r) => r.id !== id));
  }

  const inputClass =
    "w-full rounded-md border border-coc-border bg-coc-void px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:outline-none focus:border-coc-gold";
  const labelClass = "block text-xs text-coc-muted mb-1";

  return (
    <div className="space-y-4">
      {relations.length === 0 && !open && (
        <p className="text-sm text-coc-muted text-center py-4">関係メモはまだありません。</p>
      )}

      {relations.map((rel) => (
        <div
          key={rel.id}
          className="rounded-lg border border-coc-border bg-coc-surface p-4 flex gap-3"
        >
          <div className="shrink-0 pt-0.5">
            <span
              className={`inline-block rounded border px-1.5 py-0.5 text-xs font-medium ${RELATION_COLORS[rel.relation_type]}`}
            >
              {rel.relation_type}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-coc-text">{rel.target_name}</p>
            {rel.memo && (
              <p className="text-sm text-coc-muted mt-1 leading-relaxed whitespace-pre-wrap">
                {rel.memo}
              </p>
            )}
          </div>
          <button
            onClick={() => remove(rel.id)}
            className="shrink-0 text-coc-muted hover:text-red-400 text-xs transition-colors"
          >
            削除
          </button>
        </div>
      ))}

      {open ? (
        <form
          onSubmit={submit}
          className="rounded-lg border border-coc-border bg-coc-surface p-4 space-y-3"
        >
          <h3 className="font-cinzel text-sm font-semibold text-coc-gold tracking-widest">
            関係を追加
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>相手の名前 *</label>
              <input
                type="text"
                required
                placeholder="例: 田中一郎"
                value={form.target_name}
                onChange={(e) => change("target_name", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>関係タイプ</label>
              <select
                value={form.relation_type}
                onChange={(e) => change("relation_type", e.target.value)}
                className={inputClass}
              >
                {RELATION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>一言メモ</label>
            <input
              type="text"
              placeholder="例: 幼馴染。信頼できる唯一の友人。"
              value={form.memo}
              onChange={(e) => change("memo", e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={saving || !form.target_name.trim()}
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
          ＋ 関係を追加
        </button>
      )}
    </div>
  );
}
