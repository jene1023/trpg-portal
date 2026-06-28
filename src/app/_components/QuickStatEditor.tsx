"use client";

import { useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type StatKey = "hp_current" | "mp_current" | "san_current";

type Props = {
  characterId: string;
  hpCurrent: number;
  hpMax: number;
  mpCurrent: number;
  mpMax: number;
  sanCurrent: number;
  sanMax: number;
};

type StatState = {
  hp: number;
  mp: number;
  san: number;
};

const colorClass: Record<string, string> = {
  hp: "text-[var(--color-coc-hp)]",
  mp: "text-[var(--color-coc-mp)]",
  san: "text-[var(--color-coc-san)]",
};

const barColor: Record<string, string> = {
  hp: "var(--color-coc-hp)",
  mp: "var(--color-coc-mp)",
  san: "var(--color-coc-san)",
};

export default function QuickStatEditor({
  characterId,
  hpCurrent,
  hpMax,
  mpCurrent,
  mpMax,
  sanCurrent,
  sanMax,
}: Props) {
  const [stats, setStats] = useState<StatState>({
    hp: hpCurrent,
    mp: mpCurrent,
    san: sanCurrent,
  });
  const [saving, setSaving] = useState<StatKey | null>(null);

  async function adjust(key: "hp" | "mp" | "san", delta: number, max: number) {
    const next = Math.min(max, Math.max(0, stats[key] + delta));
    if (next === stats[key]) return;

    setStats((s: StatState) => ({ ...s, [key]: next }));

    if (!isSupabaseConfigured) return;

    const dbKey = `${key}_current` as StatKey;
    setSaving(dbKey);
    await supabase
      .from("characters")
      .update({ [dbKey]: next })
      .eq("id", characterId);
    setSaving(null);
  }

  const items: { key: "hp" | "mp" | "san"; label: string; max: number }[] = [
    { key: "hp", label: "HP", max: hpMax },
    { key: "mp", label: "MP", max: mpMax },
    { key: "san", label: "SAN", max: sanMax },
  ];

  return (
    <div className="space-y-2 pt-1">
      {items.map(({ key, label, max }) => {
        const cur = stats[key];
        const pct = max > 0 ? Math.min(100, Math.round((cur / max) * 100)) : 0;
        const dbKey = `${key}_current` as StatKey;

        return (
          <div key={key} className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`w-10 text-xs font-semibold ${colorClass[key]}`}>{label}</span>
              <button
                onClick={() => adjust(key, -1, max)}
                disabled={cur <= 0 || saving === dbKey}
                aria-label={`${label} -1`}
                className="w-7 h-7 rounded border border-coc-border text-coc-muted hover:text-coc-text hover:border-coc-border-glow disabled:opacity-30 transition-colors flex items-center justify-center text-sm leading-none select-none"
              >
                −
              </button>
              <span className="tabular-nums text-sm text-coc-text min-w-[56px] text-center">
                {saving === dbKey ? (
                  <span className="opacity-50">{cur}/{max}</span>
                ) : (
                  `${cur}/${max}`
                )}
              </span>
              <button
                onClick={() => adjust(key, +1, max)}
                disabled={cur >= max || saving === dbKey}
                aria-label={`${label} +1`}
                className="w-7 h-7 rounded border border-coc-border text-coc-muted hover:text-coc-text hover:border-coc-border-glow disabled:opacity-30 transition-colors flex items-center justify-center text-sm leading-none select-none"
              >
                ＋
              </button>
              <div className="flex-1 rounded-full overflow-hidden bg-coc-void h-1.5">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${pct}%`, background: barColor[key] }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
