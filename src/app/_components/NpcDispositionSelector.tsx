"use client";

import { useEffect, useRef, useState } from "react";
import { supabase, isSupabaseConfigured, NpcDispositionType } from "@/lib/supabase";

const DISPOSITIONS: {
  value: NpcDispositionType;
  label: string;
  badgeClass: string;
}[] = [
  {
    value: "unknown",
    label: "未知",
    badgeClass:
      "border-gray-600 bg-gray-500/20 text-gray-400",
  },
  {
    value: "friendly",
    label: "好意的",
    badgeClass:
      "border-green-700 bg-green-500/20 text-green-400",
  },
  {
    value: "neutral",
    label: "中立",
    badgeClass:
      "border-blue-700 bg-blue-500/20 text-blue-400",
  },
  {
    value: "hostile",
    label: "敵対的",
    badgeClass:
      "border-red-700 bg-red-500/20 text-red-400",
  },
];

type Props = {
  npcId: string;
  scenarioId: string;
  initialDisposition?: NpcDispositionType;
};

export default function NpcDispositionSelector({
  npcId,
  scenarioId,
  initialDisposition,
}: Props) {
  const [disposition, setDisposition] = useState<NpcDispositionType>(
    initialDisposition ?? "unknown"
  );
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialDisposition) return;
    if (!isSupabaseConfigured) return;
    supabase
      .from("npc_dispositions")
      .select("disposition")
      .eq("npc_id", npcId)
      .eq("scenario_id", scenarioId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.disposition) {
          setDisposition(data.disposition as NpcDispositionType);
        }
      });
  }, [npcId, scenarioId, initialDisposition]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function handleSelect(val: NpcDispositionType) {
    setDisposition(val);
    setOpen(false);
    if (!isSupabaseConfigured) return;
    await supabase.from("npc_dispositions").upsert(
      {
        npc_id: npcId,
        scenario_id: scenarioId,
        disposition: val,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "npc_id,scenario_id" }
    );
  }

  const current =
    DISPOSITIONS.find((d) => d.value === disposition) ?? DISPOSITIONS[0];

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${current.badgeClass}`}
        title="態度を変更"
      >
        {current.label}
      </button>

      {open && (
        <div className="absolute left-0 top-7 z-20 min-w-[7rem] rounded-lg border border-coc-border bg-coc-surface shadow-lg overflow-hidden">
          {DISPOSITIONS.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => handleSelect(d.value)}
              className={`flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-coc-raised transition-colors ${
                d.value === disposition ? "font-semibold" : ""
              }`}
            >
              <span
                className={`rounded-full border px-2 py-0.5 ${d.badgeClass}`}
              >
                {d.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
