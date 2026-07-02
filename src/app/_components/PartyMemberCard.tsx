"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase, isSupabaseConfigured, Character } from "@/lib/supabase";
import PartyStatAdjuster from "./PartyStatAdjuster";

function statColor(current: number, max: number): string {
  if (max <= 0) return "text-coc-muted";
  const ratio = current / max;
  if (ratio <= 0.25) return "text-red-400";
  if (ratio <= 0.5) return "text-yellow-400";
  return "text-green-400";
}

function StatBar({ label, current, max }: { label: string; current: number; max: number }) {
  const ratio = max > 0 ? Math.max(0, Math.min(1, current / max)) : 0;
  const barColor =
    ratio <= 0.25 ? "bg-red-500" : ratio <= 0.5 ? "bg-yellow-500" : "bg-green-500";
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-xs text-coc-muted">{label}</span>
        <span className={`text-sm font-bold tabular-nums ${statColor(current, max)}`}>
          {current}
          <span className="text-xs text-coc-muted font-normal">/{max}</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-coc-border overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
    </div>
  );
}

type Props = { char: Character };

export default function PartyMemberCard({ char }: Props) {
  const [hp, setHp] = useState(char.hp_current);
  const [mp, setMp] = useState(char.mp_current);
  const [san, setSan] = useState(char.san_current);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const channel = supabase
      .channel(`party-member-${char.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "characters", filter: `id=eq.${char.id}` },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          const p = payload.new as { hp_current: number; mp_current: number; san_current: number };
          setHp(p.hp_current);
          setMp(p.mp_current);
          setSan(p.san_current);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [char.id]);

  const isDead = char.status === "dead";
  const isInsane = char.status === "insane";

  return (
    <div
      className={`rounded-xl border bg-coc-surface px-5 py-4 ${
        isDead
          ? "border-red-900 opacity-60"
          : isInsane
          ? "border-purple-700"
          : "border-coc-border"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-medium text-coc-text">{char.name}</p>
          {char.player_name && (
            <p className="text-xs text-coc-muted">PL: {char.player_name}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isDead && (
            <span className="rounded-full border border-red-800 px-2 py-0.5 text-xs text-red-400">
              死亡
            </span>
          )}
          {isInsane && (
            <span className="rounded-full border border-purple-700 px-2 py-0.5 text-xs text-purple-400">
              狂気
            </span>
          )}
          <Link
            href={`/characters/${char.id}`}
            className="text-xs text-coc-gold hover:underline"
          >
            詳細 →
          </Link>
        </div>
      </div>

      <div className="flex gap-4 flex-wrap">
        <StatBar label="HP" current={hp} max={char.hp_max} />
        <StatBar label="MP" current={mp} max={char.mp_max} />
        <StatBar label="SAN" current={san} max={char.san_max} />
      </div>

      <PartyStatAdjuster
        characterId={char.id}
        hpCurrent={hp}
        hpMax={char.hp_max}
        mpCurrent={mp}
        mpMax={char.mp_max}
        sanCurrent={san}
        sanMax={char.san_max}
        con={char.con}
      />
    </div>
  );
}
