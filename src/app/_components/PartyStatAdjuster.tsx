"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type StatKey = "hp" | "mp" | "san";

const dbKeyMap: Record<StatKey, "hp_current" | "mp_current" | "san_current"> = {
  hp: "hp_current",
  mp: "mp_current",
  san: "san_current",
};

const labelMap: Record<StatKey, string> = {
  hp: "HP",
  mp: "MP",
  san: "SAN",
};

type Props = {
  characterId: string;
  hpCurrent: number;
  hpMax: number;
  mpCurrent: number;
  mpMax: number;
  sanCurrent: number;
  sanMax: number;
  con?: number;
};

export default function PartyStatAdjuster({
  characterId,
  hpCurrent,
  hpMax,
  mpCurrent,
  mpMax,
  sanCurrent,
  sanMax,
  con,
}: Props) {
  const router = useRouter();
  const [amounts, setAmounts] = useState<Record<StatKey, string>>({ hp: "", mp: "", san: "" });
  const [saving, setSaving] = useState<StatKey | null>(null);
  const [majorWound, setMajorWound] = useState(false);

  const currentMap: Record<StatKey, { current: number; max: number }> = {
    hp: { current: hpCurrent, max: hpMax },
    mp: { current: mpCurrent, max: mpMax },
    san: { current: sanCurrent, max: sanMax },
  };

  async function apply(key: StatKey, sign: 1 | -1) {
    const raw = parseInt(amounts[key], 10);
    if (!Number.isFinite(raw) || raw <= 0) return;

    const { current, max } = currentMap[key];
    const next = Math.min(max, Math.max(0, current + sign * raw));
    if (next === current) return;

    if (key === "hp" && sign === -1 && raw >= Math.ceil(max / 2)) {
      setMajorWound(true);
    } else if (key === "hp") {
      setMajorWound(false);
    }

    if (!isSupabaseConfigured) return;

    setSaving(key);
    await supabase
      .from("characters")
      .update({ [dbKeyMap[key]]: next })
      .eq("id", characterId);
    setSaving(null);
    setAmounts((a) => ({ ...a, [key]: "" }));
    router.refresh();
  }

  const keys: StatKey[] = ["hp", "mp", "san"];

  return (
    <div className="mt-3 flex flex-col gap-2 border-t border-coc-border pt-3">
      {majorWound && (
        <div className="rounded border border-red-700 bg-red-950/20 px-3 py-2 text-xs">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-red-300">⚠ 重傷判定</p>
              <p className="mt-0.5 text-red-400">最大HPの半分以上のダメージ。CONロールが必要です。</p>
              {con !== undefined && (
                <p className="mt-1 font-bold text-red-300">CON×5 = {con * 5}%</p>
              )}
            </div>
            <button
              onClick={() => setMajorWound(false)}
              aria-label="警告を閉じる"
              className="shrink-0 text-red-500 hover:text-red-300"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      {keys.map((key) => (
        <div key={key} className="flex items-center gap-2">
          <span className="w-9 text-xs font-semibold text-coc-muted">{labelMap[key]}</span>
          <input
            type="number"
            min={1}
            value={amounts[key]}
            onChange={(e) => setAmounts((a) => ({ ...a, [key]: e.target.value }))}
            placeholder="量"
            className="w-16 rounded border border-coc-border bg-coc-bg px-2 py-1 text-xs text-coc-text focus:border-coc-gold focus:outline-none"
          />
          <button
            onClick={() => apply(key, -1)}
            disabled={saving === key}
            className="rounded border border-red-800 px-2.5 py-1 text-xs text-red-400 hover:bg-red-900/20 disabled:opacity-30 transition-colors"
          >
            ダメージ
          </button>
          <button
            onClick={() => apply(key, 1)}
            disabled={saving === key}
            className="rounded border border-green-800 px-2.5 py-1 text-xs text-green-400 hover:bg-green-900/20 disabled:opacity-30 transition-colors"
          >
            回復
          </button>
        </div>
      ))}
    </div>
  );
}
