"use client";

import React, { useState, useCallback } from "react";
import { supabase, isSupabaseConfigured, CharacterCondition } from "@/lib/supabase";

const PRESET_CONDITIONS: { name: string; color: string }[] = [
  { name: "負傷", color: "red" },
  { name: "毒", color: "green" },
  { name: "拘束", color: "yellow" },
  { name: "盲目", color: "gray" },
  { name: "硬直", color: "blue" },
  { name: "出血", color: "red" },
  { name: "疲弊", color: "yellow" },
  { name: "その他", color: "gray" },
];

const COLOR_MAP: Record<string, { badge: string; button: string }> = {
  red: {
    badge: "border-red-700 bg-red-950/40 text-red-300",
    button: "bg-red-900/30 border-red-700 text-red-300 hover:bg-red-900/60",
  },
  green: {
    badge: "border-green-700 bg-green-950/40 text-green-300",
    button: "bg-green-900/30 border-green-700 text-green-300 hover:bg-green-900/60",
  },
  yellow: {
    badge: "border-yellow-700 bg-yellow-950/40 text-yellow-300",
    button: "bg-yellow-900/30 border-yellow-700 text-yellow-300 hover:bg-yellow-900/60",
  },
  blue: {
    badge: "border-blue-700 bg-blue-950/40 text-blue-300",
    button: "bg-blue-900/30 border-blue-700 text-blue-300 hover:bg-blue-900/60",
  },
  gray: {
    badge: "border-coc-border bg-coc-raised text-coc-muted",
    button: "bg-coc-raised border-coc-border text-coc-muted hover:bg-coc-surface",
  },
};

function colorStyle(color: string | null) {
  return COLOR_MAP[color ?? "gray"] ?? COLOR_MAP["gray"];
}

type Props = {
  characterId: string;
  initialConditions: CharacterCondition[];
};

export default function ConditionBadgeEditor({ characterId, initialConditions }: Props) {
  const [conditions, setConditions] = useState<CharacterCondition[]>(initialConditions);
  const [customName, setCustomName] = useState("");
  const [saving, setSaving] = useState(false);

  const activeConditions = conditions.filter((c) => c.is_active);

  const addPreset = useCallback(async (name: string, color: string) => {
    if (!isSupabaseConfigured) return;
    const existing = conditions.find((c) => c.condition_name === name);
    if (existing) {
      if (!existing.is_active) {
        setSaving(true);
        const { data } = await supabase
          .from("character_conditions")
          .update({ is_active: true })
          .eq("id", existing.id)
          .select()
          .single();
        if (data) setConditions((prev: CharacterCondition[]) => prev.map((c: CharacterCondition) => (c.id === data.id ? data : c)));
        setSaving(false);
      }
      return;
    }
    setSaving(true);
    const { data } = await supabase
      .from("character_conditions")
      .insert({ character_id: characterId, condition_name: name, color, is_active: true })
      .select()
      .single();
    if (data) setConditions((prev: CharacterCondition[]) => [...prev, data]);
    setSaving(false);
  }, [characterId, conditions]);

  const toggleCondition = useCallback(async (condition: CharacterCondition) => {
    if (!isSupabaseConfigured) return;
    const next = !condition.is_active;
    setSaving(true);
    const { data } = await supabase
      .from("character_conditions")
      .update({ is_active: next })
      .eq("id", condition.id)
      .select()
      .single();
    if (data) setConditions((prev: CharacterCondition[]) => prev.map((c: CharacterCondition) => (c.id === data.id ? data : c)));
    setSaving(false);
  }, []);

  const addCustom = useCallback(async () => {
    const name = customName.trim();
    if (!name || !isSupabaseConfigured) return;
    setSaving(true);
    const { data } = await supabase
      .from("character_conditions")
      .insert({ character_id: characterId, condition_name: name, color: "gray", is_active: true })
      .select()
      .single();
    if (data) setConditions((prev: CharacterCondition[]) => [...prev, data]);
    setCustomName("");
    setSaving(false);
  }, [characterId, customName]);

  return (
    <div className="space-y-3">
      {/* アクティブな状態異常バッジ */}
      {activeConditions.length === 0 ? (
        <p className="text-sm text-coc-muted">現在の状態異常なし</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {activeConditions.map((c: CharacterCondition) => {
            const style = colorStyle(c.color);
            return (
              <button
                key={c.id}
                onClick={() => toggleCondition(c)}
                disabled={saving}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${style.badge} hover:opacity-80 disabled:opacity-50`}
                title="クリックで解除"
              >
                {c.condition_name} ✕
              </button>
            );
          })}
        </div>
      )}

      {/* プリセット追加ボタン */}
      <div className="flex flex-wrap gap-1.5">
        {PRESET_CONDITIONS.map((p: { name: string; color: string }) => {
          const active = conditions.find((c: CharacterCondition) => c.condition_name === p.name && c.is_active);
          const style = colorStyle(p.color);
          return (
            <button
              key={p.name}
              onClick={() => {
                const existing = conditions.find((c: CharacterCondition) => c.condition_name === p.name);
                if (existing) {
                  toggleCondition(existing);
                } else {
                  addPreset(p.name, p.color);
                }
              }}
              disabled={saving}
              className={`rounded border px-2.5 py-1 text-xs transition-colors disabled:opacity-50 ${
                active ? style.button + " ring-1 ring-inset" : "border-coc-border bg-coc-raised text-coc-muted hover:border-coc-border-glow hover:text-coc-text"
              }`}
            >
              {active ? "✓ " : "+ "}{p.name}
            </button>
          );
        })}
      </div>

      {/* カスタム追加 */}
      <div className="flex gap-2">
        <input
          type="text"
          value={customName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomName(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") addCustom(); }}
          placeholder="カスタム状態異常を追加..."
          className="flex-1 rounded border border-coc-border bg-coc-void px-3 py-1.5 text-sm text-coc-text placeholder:text-coc-muted focus:outline-none focus:border-coc-border-glow"
        />
        <button
          onClick={addCustom}
          disabled={saving || !customName.trim()}
          className="rounded border border-coc-border px-3 py-1.5 text-sm text-coc-muted hover:text-coc-text hover:border-coc-border-glow transition-colors disabled:opacity-50"
        >
          追加
        </button>
      </div>
    </div>
  );
}
