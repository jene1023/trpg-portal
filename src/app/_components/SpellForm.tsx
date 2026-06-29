"use client";

import { useState } from "react";
import { supabase, isSupabaseConfigured, CharacterSpell } from "@/lib/supabase";

type Props = {
  characterId: string;
  initialSpells: CharacterSpell[];
};

type FormState = {
  spell_name: string;
  mp_cost: string;
  san_cost: string;
  casting_time: string;
  effect: string;
  source_page: string;
};

const EMPTY_FORM: FormState = {
  spell_name: "",
  mp_cost: "",
  san_cost: "",
  casting_time: "",
  effect: "",
  source_page: "",
};

export default function SpellForm({ characterId, initialSpells }: Props) {
  const [spells, setSpells] = useState<CharacterSpell[]>(initialSpells);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  function change(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.spell_name.trim()) return;
    if (!isSupabaseConfigured) return;

    setSaving(true);
    const { data, error } = await supabase
      .from("character_spells")
      .insert({
        character_id: characterId,
        spell_name: form.spell_name.trim(),
        mp_cost: form.mp_cost !== "" ? parseInt(form.mp_cost) || null : null,
        san_cost: form.san_cost !== "" ? parseInt(form.san_cost) || null : null,
        casting_time: form.casting_time.trim() || null,
        effect: form.effect.trim() || null,
        source_page: form.source_page.trim() || null,
      })
      .select()
      .single();
    setSaving(false);

    if (!error && data) {
      setSpells((prev) => [...prev, data as CharacterSpell]);
      setForm(EMPTY_FORM);
      setOpen(false);
    }
  }

  async function remove(id: string) {
    if (!isSupabaseConfigured) return;
    await supabase.from("character_spells").delete().eq("id", id);
    setSpells((prev) => prev.filter((s) => s.id !== id));
  }

  const inputClass =
    "w-full rounded-md border border-coc-border bg-coc-void px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:outline-none focus:border-coc-gold";
  const labelClass = "block text-xs text-coc-muted mb-1";

  return (
    <div className="space-y-4">
      {spells.length === 0 && !open && (
        <p className="text-sm text-coc-muted text-center py-4">習得呪文なし</p>
      )}

      <div className="space-y-3">
        {spells.map((spell) => (
          <div
            key={spell.id}
            className="rounded-lg border border-coc-border bg-coc-surface p-4 space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold text-coc-text leading-tight">
                {spell.spell_name}
              </h3>
              <button
                onClick={() => remove(spell.id)}
                className="shrink-0 text-coc-muted hover:text-red-400 text-xs transition-colors"
              >
                削除
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {spell.mp_cost != null && (
                <span className="rounded border border-blue-800 bg-blue-950/30 px-2 py-0.5 text-xs text-blue-300">
                  MP {spell.mp_cost}
                </span>
              )}
              {spell.san_cost != null && (
                <span className="rounded border border-red-800 bg-red-950/30 px-2 py-0.5 text-xs text-red-300">
                  SAN {spell.san_cost}
                </span>
              )}
              {spell.casting_time && (
                <span className="rounded border border-coc-border bg-coc-raised px-2 py-0.5 text-xs text-coc-muted">
                  詠唱: {spell.casting_time}
                </span>
              )}
              {spell.source_page && (
                <span className="rounded border border-coc-border bg-coc-raised px-2 py-0.5 text-xs text-coc-muted">
                  p.{spell.source_page}
                </span>
              )}
            </div>

            {spell.effect && (
              <p className="text-sm text-coc-muted leading-relaxed whitespace-pre-wrap">
                {spell.effect}
              </p>
            )}
          </div>
        ))}
      </div>

      {open ? (
        <form
          onSubmit={submit}
          className="rounded-lg border border-coc-border bg-coc-surface p-4 space-y-3"
        >
          <h3 className="font-cinzel text-sm font-semibold text-coc-gold tracking-widest">
            呪文を追加
          </h3>

          <div>
            <label className={labelClass}>呪文名 *</label>
            <input
              type="text"
              required
              placeholder="例: コンタクト・グール"
              value={form.spell_name}
              onChange={(e) => change("spell_name", e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>MP消費</label>
              <input
                type="number"
                min={0}
                placeholder="例: 3"
                value={form.mp_cost}
                onChange={(e) => change("mp_cost", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>SAN消費</label>
              <input
                type="number"
                min={0}
                placeholder="例: 1"
                value={form.san_cost}
                onChange={(e) => change("san_cost", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>詠唱時間</label>
            <input
              type="text"
              placeholder="例: 1ラウンド"
              value={form.casting_time}
              onChange={(e) => change("casting_time", e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>効果概要</label>
            <textarea
              rows={3}
              placeholder="例: グールを1体召喚する。グールはPOWの対抗ロールで制御を試みる。"
              value={form.effect}
              onChange={(e) => change("effect", e.target.value)}
              className={`${inputClass} resize-none`}
            />
          </div>

          <div>
            <label className={labelClass}>ページ参照（ルールブック）</label>
            <input
              type="text"
              placeholder="例: 242"
              value={form.source_page}
              onChange={(e) => change("source_page", e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={saving || !form.spell_name.trim()}
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
          ＋ 呪文を追加
        </button>
      )}
    </div>
  );
}
