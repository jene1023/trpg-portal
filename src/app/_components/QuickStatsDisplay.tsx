"use client";

import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

const colorClass: Record<string, string> = {
  hp: "text-[var(--color-coc-hp)]",
  mp: "text-[var(--color-coc-mp)]",
  san: "text-[var(--color-coc-san)]",
};

type Props = {
  characterId: string;
  hpCurrent: number;
  hpMax: number;
  mpCurrent: number;
  mpMax: number;
  sanCurrent: number;
  sanMax: number;
};

export default function QuickStatsDisplay({
  characterId,
  hpCurrent,
  hpMax,
  mpCurrent,
  mpMax,
  sanCurrent,
  sanMax,
}: Props) {
  const [stats, setStats] = useState({ hp: hpCurrent, mp: mpCurrent, san: sanCurrent });

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const channel = supabase
      .channel(`qsd-${characterId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "characters", filter: `id=eq.${characterId}` },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          const p = payload.new as { hp_current: number; mp_current: number; san_current: number };
          setStats({ hp: p.hp_current, mp: p.mp_current, san: p.san_current });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [characterId]);

  const items = [
    { key: "hp", label: "HP", current: stats.hp, max: hpMax },
    { key: "mp", label: "MP", current: stats.mp, max: mpMax },
    { key: "san", label: "SAN", current: stats.san, max: sanMax },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 mb-4">
      {items.map(({ key, label, current, max }) => (
        <div key={key} className="flex flex-col items-center gap-1">
          <span className={`text-xs font-semibold tracking-widest ${colorClass[key]}`}>{label}</span>
          <span className={`text-5xl font-bold tabular-nums leading-none ${colorClass[key]}`}>
            {current}
          </span>
          <span className="text-sm text-coc-muted">/{max}</span>
        </div>
      ))}
    </div>
  );
}
