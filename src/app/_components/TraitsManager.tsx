"use client";

import { useState } from "react";
import { supabase, isSupabaseConfigured, CharacterTrait, TraitType } from "@/lib/supabase";

const TRAIT_SECTIONS: { type: TraitType; label: string; placeholder: string }[] = [
  { type: "person",      label: "重要な人物",           placeholder: "例: 山田博士 — 恩師。事件の鍵を握る人物。" },
  { type: "place",       label: "重要な場所",           placeholder: "例: 故郷の神社 — 子供の頃の記憶が宿る。" },
  { type: "treasure",    label: "大切な宝物",           placeholder: "例: 祖父の懐中時計 — 常に身に付けている。" },
  { type: "personality", label: "性格的特質",           placeholder: "例: 極度の慎重家。決断前に必ず熟慮する。" },
  { type: "ideology",    label: "イデオロギー/信念",     placeholder: "例: 「科学こそが真実」を信条とする合理主義者。" },
  { type: "wound",       label: "重大な傷・狂気・傷跡", placeholder: "例: 幼少期のトラウマにより暗所が苦手。" },
];

type Props = {
  characterId: string;
  initialTraits: CharacterTrait[];
};

export default function TraitsManager({ characterId, initialTraits }: Props) {
  const [traits, setTraits] = useState<CharacterTrait[]>(initialTraits);
  const [openSection, setOpenSection] = useState<TraitType | null>(null);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  async function addTrait(type: TraitType) {
    if (!content.trim() || !isSupabaseConfigured) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("character_traits")
      .insert({ character_id: characterId, trait_type: type, content: content.trim() })
      .select()
      .single();
    setSaving(false);
    if (!error && data) {
      setTraits((prev) => [...prev, data as CharacterTrait]);
      setContent("");
      setOpenSection(null);
    }
  }

  async function removeTrait(id: string) {
    if (!isSupabaseConfigured) return;
    await supabase.from("character_traits").delete().eq("id", id);
    setTraits((prev) => prev.filter((t) => t.id !== id));
  }

  function openAdd(type: TraitType) {
    setOpenSection(type);
    setContent("");
  }

  const inputClass =
    "w-full rounded-md border border-coc-border bg-coc-void px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:outline-none focus:border-coc-gold";

  return (
    <div className="space-y-6">
      {TRAIT_SECTIONS.map(({ type, label, placeholder }) => {
        const sectionTraits = traits.filter((t) => t.trait_type === type);
        const isOpen = openSection === type;

        return (
          <div key={type} className="rounded-lg border border-coc-border bg-coc-surface overflow-hidden">
            <div className="px-4 py-3 border-b border-coc-border flex items-center justify-between">
              <h2 className="font-cinzel text-sm font-semibold text-coc-gold tracking-widest">
                {label}
              </h2>
              <span className="text-xs text-coc-muted">{sectionTraits.length}件</span>
            </div>

            <div className="p-4 space-y-2">
              {sectionTraits.length === 0 && !isOpen && (
                <p className="text-xs text-coc-muted text-center py-1">未登録</p>
              )}

              {sectionTraits.map((trait) => (
                <div
                  key={trait.id}
                  className="flex items-start gap-3 rounded-md border border-coc-border bg-coc-raised px-3 py-2"
                >
                  <p className="flex-1 text-sm text-coc-text leading-relaxed whitespace-pre-wrap">
                    {trait.content}
                  </p>
                  <button
                    onClick={() => removeTrait(trait.id)}
                    className="shrink-0 text-coc-muted hover:text-red-400 text-xs transition-colors mt-0.5"
                  >
                    削除
                  </button>
                </div>
              ))}

              {isOpen ? (
                <div className="space-y-2 pt-1">
                  <textarea
                    autoFocus
                    rows={2}
                    placeholder={placeholder}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className={inputClass + " resize-none"}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => addTrait(type)}
                      disabled={saving || !content.trim()}
                      className="flex-1 rounded-lg bg-coc-gold text-black font-semibold text-sm py-1.5 disabled:opacity-40 hover:brightness-110 transition-all"
                    >
                      {saving ? "保存中…" : "追加"}
                    </button>
                    <button
                      onClick={() => setOpenSection(null)}
                      className="px-4 rounded-lg border border-coc-border text-coc-muted hover:text-coc-text text-sm transition-colors"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => openAdd(type)}
                  className="w-full rounded-md border border-dashed border-coc-border text-coc-muted hover:text-coc-text hover:border-coc-border-glow py-1.5 text-xs transition-colors"
                >
                  ＋ 追加
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
