"use client";

import { useState } from "react";
import { supabase, isSupabaseConfigured, CharacterTome } from "@/lib/supabase";

type Props = {
  characterId: string;
  initialTomes: CharacterTome[];
};

type FormState = {
  title: string;
  author: string;
  language: string;
  san_loss_skimming: string;
  san_loss_full_read: string;
  cthulhu_mythos_gain: string;
  spells_contained: string;
  notes: string;
};

const EMPTY_FORM: FormState = {
  title: "",
  author: "",
  language: "",
  san_loss_skimming: "",
  san_loss_full_read: "",
  cthulhu_mythos_gain: "",
  spells_contained: "",
  notes: "",
};

export default function TomeForm({ characterId, initialTomes }: Props) {
  const [tomes, setTomes] = useState<CharacterTome[]>(initialTomes);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  function change(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (!isSupabaseConfigured) return;

    setSaving(true);
    const { data, error } = await supabase
      .from("character_tomes")
      .insert({
        character_id: characterId,
        title: form.title.trim(),
        author: form.author.trim() || null,
        language: form.language.trim() || null,
        san_loss_skimming: form.san_loss_skimming.trim() || null,
        san_loss_full_read: form.san_loss_full_read.trim() || null,
        cthulhu_mythos_gain:
          form.cthulhu_mythos_gain !== ""
            ? parseInt(form.cthulhu_mythos_gain) || null
            : null,
        spells_contained: form.spells_contained.trim() || null,
        is_read: false,
        notes: form.notes.trim() || null,
      })
      .select()
      .single();
    setSaving(false);

    if (!error && data) {
      setTomes((prev) => [...prev, data as CharacterTome]);
      setForm(EMPTY_FORM);
      setOpen(false);
    }
  }

  async function toggleRead(tome: CharacterTome) {
    if (!isSupabaseConfigured) return;
    const newVal = !tome.is_read;
    await supabase
      .from("character_tomes")
      .update({ is_read: newVal })
      .eq("id", tome.id);
    setTomes((prev) =>
      prev.map((t) => (t.id === tome.id ? { ...t, is_read: newVal } : t))
    );
  }

  async function remove(id: string) {
    if (!isSupabaseConfigured) return;
    await supabase.from("character_tomes").delete().eq("id", id);
    setTomes((prev) => prev.filter((t) => t.id !== id));
  }

  const inputClass =
    "w-full rounded-md border border-coc-border bg-coc-void px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:outline-none focus:border-coc-gold";
  const labelClass = "block text-xs text-coc-muted mb-1";

  return (
    <div className="space-y-4">
      {tomes.length === 0 && !open && (
        <p className="text-sm text-coc-muted text-center py-4">所有魔道書なし</p>
      )}

      <div className="space-y-3">
        {tomes.map((tome) => (
          <div
            key={tome.id}
            className={`rounded-lg border p-4 space-y-2 transition-colors ${
              tome.is_read
                ? "border-purple-800/60 bg-purple-950/10"
                : "border-coc-border bg-coc-surface"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-coc-text leading-tight">
                  {tome.title}
                </h3>
                {(tome.author || tome.language) && (
                  <p className="text-xs text-coc-muted mt-0.5">
                    {tome.author && <span>{tome.author}</span>}
                    {tome.author && tome.language && <span> · </span>}
                    {tome.language && <span>{tome.language}</span>}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleRead(tome)}
                  className={`rounded px-2 py-0.5 text-xs border transition-colors ${
                    tome.is_read
                      ? "border-purple-700 bg-purple-900/40 text-purple-300 hover:bg-purple-900/60"
                      : "border-coc-border bg-coc-raised text-coc-muted hover:text-coc-text"
                  }`}
                >
                  {tome.is_read ? "読了" : "未読"}
                </button>
                <button
                  onClick={() => remove(tome.id)}
                  className="text-coc-muted hover:text-red-400 text-xs transition-colors"
                >
                  削除
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {tome.san_loss_skimming && (
                <span className="rounded border border-yellow-800 bg-yellow-950/30 px-2 py-0.5 text-xs text-yellow-300">
                  流し読みSAN {tome.san_loss_skimming}
                </span>
              )}
              {tome.san_loss_full_read && (
                <span className="rounded border border-red-800 bg-red-950/30 px-2 py-0.5 text-xs text-red-300">
                  熟読SAN {tome.san_loss_full_read}
                </span>
              )}
              {tome.cthulhu_mythos_gain != null && (
                <span className="rounded border border-purple-800 bg-purple-950/30 px-2 py-0.5 text-xs text-purple-300">
                  神話技能 +{tome.cthulhu_mythos_gain}
                </span>
              )}
            </div>

            {tome.spells_contained && (
              <p className="text-xs text-coc-muted">
                <span className="font-semibold text-coc-text/70">収録呪文: </span>
                {tome.spells_contained}
              </p>
            )}

            {tome.notes && (
              <p className="text-sm text-coc-muted leading-relaxed whitespace-pre-wrap">
                {tome.notes}
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
            魔道書を追加
          </h3>

          <div>
            <label className={labelClass}>タイトル *</label>
            <input
              type="text"
              required
              placeholder="例: ネクロノミコン"
              value={form.title}
              onChange={(e) => change("title", e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>著者</label>
              <input
                type="text"
                placeholder="例: アブドゥル・アルハザード"
                value={form.author}
                onChange={(e) => change("author", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>言語</label>
              <input
                type="text"
                placeholder="例: アラビア語"
                value={form.language}
                onChange={(e) => change("language", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>流し読みSAN喪失</label>
              <input
                type="text"
                placeholder="例: 1/1d3"
                value={form.san_loss_skimming}
                onChange={(e) => change("san_loss_skimming", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>熟読SAN喪失</label>
              <input
                type="text"
                placeholder="例: 1d4/2d6"
                value={form.san_loss_full_read}
                onChange={(e) => change("san_loss_full_read", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>クトゥルフ神話技能上昇値</label>
            <input
              type="number"
              min={0}
              placeholder="例: 5"
              value={form.cthulhu_mythos_gain}
              onChange={(e) => change("cthulhu_mythos_gain", e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>収録呪文</label>
            <input
              type="text"
              placeholder="例: コンタクト・グール、邪神召喚"
              value={form.spells_contained}
              onChange={(e) => change("spells_contained", e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>メモ</label>
            <textarea
              rows={3}
              placeholder="入手経緯や特記事項など"
              value={form.notes}
              onChange={(e) => change("notes", e.target.value)}
              className={`${inputClass} resize-none`}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={saving || !form.title.trim()}
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
          ＋ 魔道書を追加
        </button>
      )}
    </div>
  );
}
