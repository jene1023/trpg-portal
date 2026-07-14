"use client";

import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type PartyMember = {
  id: string;
  name: string;
  hp_current: number;
  hp_max: number;
  san_current: number;
  san_max: number;
};

type Props = {
  members: PartyMember[];
  scenarioId: string;
};

export default function PartyStatusBar({ members: initialMembers, scenarioId }: Props) {
  const [members, setMembers] = useState<PartyMember[]>(initialMembers);

  useEffect(() => {
    if (!isSupabaseConfigured || initialMembers.length === 0) return;
    const memberIds = new Set(initialMembers.map((m) => m.id));
    const channel = supabase
      .channel(`party-bar-${scenarioId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "characters" },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          const p = payload.new as {
            id: string;
            hp_current: number;
            hp_max: number;
            san_current: number;
            san_max: number;
          };
          if (!memberIds.has(p.id)) return;
          setMembers((prev) =>
            prev.map((m) =>
              m.id === p.id
                ? {
                    ...m,
                    hp_current: p.hp_current,
                    hp_max: p.hp_max,
                    san_current: p.san_current,
                    san_max: p.san_max,
                  }
                : m
            )
          );
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [scenarioId, initialMembers]);

  if (members.length === 0) return null;

  return (
    <div className="rounded-lg border border-coc-border bg-coc-surface p-3">
      <p className="text-[10px] font-semibold text-coc-muted uppercase tracking-widest mb-2">
        パーティ状態
      </p>
      <div className="overflow-x-auto pb-0.5">
        <div className="flex gap-2.5" style={{ minWidth: "max-content" }}>
          {members.map((m) => {
            const hpPct =
              m.hp_max > 0
                ? Math.min(100, Math.round((m.hp_current / m.hp_max) * 100))
                : 0;
            const sanPct =
              m.san_max > 0
                ? Math.min(100, Math.round((m.san_current / m.san_max) * 100))
                : 0;
            return (
              <div
                key={m.id}
                className="rounded border border-coc-border bg-coc-void px-2.5 py-2 w-[110px] shrink-0"
              >
                <p className="text-xs font-semibold text-coc-text truncate mb-1.5">
                  {m.name}
                </p>
                <div className="space-y-1.5">
                  <div>
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-[10px] font-semibold text-[var(--color-coc-hp)]">
                        HP
                      </span>
                      <span className="text-[10px] text-coc-muted tabular-nums">
                        {m.hp_current}/{m.hp_max}
                      </span>
                    </div>
                    <div className="rounded-full overflow-hidden h-1" style={{ background: "var(--color-coc-void, #0a0a0f)" }}>
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${hpPct}%`,
                          background: "var(--color-coc-hp)",
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-[10px] font-semibold text-[var(--color-coc-san)]">
                        SAN
                      </span>
                      <span className="text-[10px] text-coc-muted tabular-nums">
                        {m.san_current}/{m.san_max}
                      </span>
                    </div>
                    <div className="rounded-full overflow-hidden h-1" style={{ background: "var(--color-coc-void, #0a0a0f)" }}>
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${sanPct}%`,
                          background: "var(--color-coc-san)",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
