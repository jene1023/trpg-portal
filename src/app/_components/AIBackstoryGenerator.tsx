"use client";

import { useState } from "react";
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { supabase, isSupabaseConfigured, TraitType } from "@/lib/supabase";

type GeneratedFields = {
  background?: string;
  personality?: string;
  appearance?: string;
  person?: string;
  treasure?: string;
};

type CharacterSummary = {
  id: string;
  name: string;
  occupation?: string | null;
  rule_edition?: "6th" | "7th" | null;
  str?: number | null;
  con?: number | null;
  pow?: number | null;
  dex?: number | null;
  app?: number | null;
  siz?: number | null;
  int_stat?: number | null;
  edu?: number | null;
};

type Props = {
  character: CharacterSummary;
  onTraitAdded: (trait: { id: string; character_id: string; trait_type: TraitType; content: string; created_at: string }) => void;
};

const FIELD_CONFIG: { key: keyof GeneratedFields; label: string; traitType: TraitType | null; placeholder: string }[] = [
  { key: "background", label: "背景（生い立ち・経歴）", traitType: null, placeholder: "" },
  { key: "personality", label: "性格的特質", traitType: "personality", placeholder: "" },
  { key: "appearance", label: "外見の特徴", traitType: null, placeholder: "" },
  { key: "person", label: "重要な人物", traitType: "person", placeholder: "" },
  { key: "treasure", label: "大切な宝物", traitType: "treasure", placeholder: "" },
];

export default function AIBackstoryGenerator({ character, onTraitAdded }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<GeneratedFields>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set());

  async function generate() {
    setError(null);
    setLoading(true);
    setFields({});
    setSaved(new Set());

    try {
      const res = await fetch("/api/characters/generate-background", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          occupation: character.occupation,
          rule_edition: character.rule_edition,
          str: character.str,
          con: character.con,
          pow: character.pow,
          dex: character.dex,
          app: character.app,
          siz: character.siz,
          int_stat: character.int_stat,
          edu: character.edu,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "生成に失敗しました。");
        return;
      }
      setFields(data.result as GeneratedFields);
    } catch {
      setError("ネットワークエラーが発生しました。");
    } finally {
      setLoading(false);
    }
  }

  async function saveTrait(key: keyof GeneratedFields, traitType: TraitType) {
    const content = fields[key];
    if (!content || !isSupabaseConfigured) return;
    setSaving(key);

    const { data, error: err } = await supabase
      .from("character_traits")
      .insert({ character_id: character.id, trait_type: traitType, content: content.trim() })
      .select()
      .single();

    setSaving(null);
    if (!err && data) {
      onTraitAdded(data as { id: string; character_id: string; trait_type: TraitType; content: string; created_at: string });
      setSaved((prev) => new Set(prev).add(key));
    }
  }

  const hasResults = Object.keys(fields).length > 0;

  return (
    <div className="rounded-lg border border-coc-border bg-coc-surface overflow-hidden mb-6">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-coc-raised transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-coc-gold" />
          <span className="font-cinzel text-sm font-semibold text-coc-gold tracking-widest">
            AIで設定を生成
          </span>
        </div>
        {open ? <ChevronUp size={16} className="text-coc-muted" /> : <ChevronDown size={16} className="text-coc-muted" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-coc-border pt-4">
          <p className="text-xs text-coc-muted">
            キャラクターの職業・時代・能力値を元にAIが性格・背景・重要情報を提案します。
            生成後に各フィールドを編集して「追加」できます。
          </p>

          <button
            onClick={generate}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-coc-gold text-black font-semibold text-sm px-4 py-2 disabled:opacity-50 hover:brightness-110 transition-all"
          >
            <Sparkles size={14} />
            {loading ? "生成中…" : "生成する"}
          </button>

          {error && (
            <div className="rounded-lg border border-red-700 bg-red-900/20 px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

          {hasResults && (
            <div className="space-y-3">
              {FIELD_CONFIG.map(({ key, label, traitType }) => {
                const value = fields[key];
                if (!value) return null;
                const isSaved = saved.has(key);
                const isSaving = saving === key;

                return (
                  <div key={key} className="rounded-md border border-coc-border bg-coc-void overflow-hidden">
                    <div className="px-3 py-1.5 border-b border-coc-border flex items-center justify-between">
                      <span className="text-xs font-semibold text-coc-gold">{label}</span>
                      {traitType && (
                        isSaved ? (
                          <span className="text-xs text-green-400">✓ 追加済み</span>
                        ) : (
                          <button
                            onClick={() => saveTrait(key, traitType)}
                            disabled={isSaving}
                            className="text-xs text-coc-gold hover:underline disabled:opacity-50"
                          >
                            {isSaving ? "追加中…" : "特質に追加"}
                          </button>
                        )
                      )}
                    </div>
                    <textarea
                      rows={2}
                      value={value}
                      onChange={(e) => setFields((prev) => ({ ...prev, [key]: e.target.value }))}
                      className="w-full px-3 py-2 text-sm text-coc-text bg-transparent resize-none focus:outline-none"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
