"use client";

import { useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type EncounterEntry = {
  id: string;
  npc_id: string;
  npc_name: string;
};

type Props = {
  sessionId: string;
  allNpcs: { id: string; name: string }[];
  initialEncounters: EncounterEntry[];
};

export default function SessionNpcEncounters({ sessionId, allNpcs, initialEncounters }: Props) {
  const [encounters, setEncounters] = useState<EncounterEntry[]>(initialEncounters);
  const [selectedNpcId, setSelectedNpcId] = useState("");
  const [saving, setSaving] = useState(false);

  const linkedIds = new Set(encounters.map((e) => e.npc_id));
  const availableNpcs = allNpcs.filter((n) => !linkedIds.has(n.id));

  async function addEncounter() {
    if (!selectedNpcId || !isSupabaseConfigured) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("session_npc_encounters")
      .insert({ session_id: sessionId, npc_id: selectedNpcId })
      .select()
      .single();
    setSaving(false);

    if (!error && data) {
      const npc = allNpcs.find((n) => n.id === selectedNpcId);
      if (npc) {
        setEncounters((prev) => [...prev, { id: data.id, npc_id: npc.id, npc_name: npc.name }]);
      }
      setSelectedNpcId("");
    }
  }

  async function removeEncounter(encounterId: string) {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase
      .from("session_npc_encounters")
      .delete()
      .eq("id", encounterId);

    if (!error) {
      setEncounters((prev) => prev.filter((e) => e.id !== encounterId));
    }
  }

  return (
    <div className="pt-2 border-t border-coc-border space-y-2">
      <p className="text-xs font-medium text-coc-muted">登場NPC</p>
      {encounters.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {encounters.map((e) => (
            <span
              key={e.id}
              className="inline-flex items-center gap-1 rounded-full border border-coc-border bg-coc-raised px-2 py-0.5 text-xs text-coc-text"
            >
              {e.npc_name}
              <button
                onClick={() => removeEncounter(e.id)}
                className="text-coc-muted hover:text-red-400 transition-colors"
                aria-label={`${e.npc_name}を削除`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      {availableNpcs.length > 0 && (
        <div className="flex gap-2">
          <select
            value={selectedNpcId}
            onChange={(e) => setSelectedNpcId(e.target.value)}
            className="flex-1 rounded-md border border-coc-border bg-coc-void px-2 py-1.5 text-xs text-coc-text focus:outline-none focus:border-coc-gold"
          >
            <option value="">NPCを選択…</option>
            {availableNpcs.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name}
              </option>
            ))}
          </select>
          <button
            onClick={addEncounter}
            disabled={!selectedNpcId || saving}
            className="px-3 rounded-md border border-coc-border text-coc-muted hover:text-coc-text text-xs disabled:opacity-40 transition-colors"
          >
            追加
          </button>
        </div>
      )}
    </div>
  );
}
