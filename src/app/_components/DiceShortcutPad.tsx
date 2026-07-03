"use client";

import { useState, useEffect } from "react";
import { Dice6 } from "lucide-react";
import { supabase, isSupabaseConfigured, DiceShortcut } from "@/lib/supabase";
import { evaluateDiceExpression } from "@/lib/diceExpression";

type Props = {
  characterId: string;
};

type RollResult = {
  label: string;
  expression: string;
  total: number;
  detail: string;
};

export default function DiceShortcutPad({ characterId }: Props) {
  const [shortcuts, setShortcuts] = useState<DiceShortcut[]>([]);
  const [result, setResult] = useState<RollResult | null>(null);
  const [rolling, setRolling] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase
      .from("dice_shortcuts")
      .select("*")
      .eq("character_id", characterId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) setShortcuts(data);
      });
  }, [characterId]);

  if (shortcuts.length === 0) return null;

  function roll(shortcut: DiceShortcut) {
    if (rolling) return;
    setRolling(shortcut.id);
    setResult(null);
    setTimeout(() => {
      const evaluated = evaluateDiceExpression(shortcut.expression);
      setResult({
        label: shortcut.label,
        expression: shortcut.expression,
        total: evaluated.total,
        detail: evaluated.detail,
      });
      setRolling(null);

      if (isSupabaseConfigured) {
        supabase.from("dice_rolls").insert({
          character_id: characterId,
          skill_name: `ショートカット: ${shortcut.label}`,
          skill_value: 0,
          roll_value: evaluated.total,
          success_level: "success",
          rolled_at: new Date().toISOString(),
        });
      }
    }, 300);
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-coc-muted font-semibold">ショートカットダイス</p>
      <div className="flex flex-wrap gap-2">
        {shortcuts.map((s) => (
          <button
            key={s.id}
            onClick={() => roll(s)}
            disabled={!!rolling}
            className="flex items-center gap-1.5 rounded-md border border-coc-border bg-coc-raised px-3 py-1.5 text-xs text-coc-muted hover:text-coc-text hover:border-coc-border-glow transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Dice6 size={12} className={rolling === s.id ? "animate-spin" : ""} />
            <span className="font-medium">{s.label}</span>
            <span className="text-coc-muted/60">{s.expression}</span>
          </button>
        ))}
      </div>

      {result && (
        <div className="rounded-md border border-coc-border bg-coc-raised px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-coc-muted mb-0.5">
              {result.label}（{result.expression}）
            </p>
            <p className="text-sm text-coc-muted">{result.detail}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-coc-muted mb-0.5">結果</p>
            <p className="font-cinzel text-2xl font-bold text-coc-text">{result.total}</p>
          </div>
        </div>
      )}
    </div>
  );
}
