"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type Props = { npcId: string };

export default function NpcDuplicateButton({ npcId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDuplicate() {
    if (!isSupabaseConfigured) return;
    setLoading(true);
    try {
      const { data: npc } = await supabase
        .from("npcs")
        .select("*")
        .eq("id", npcId)
        .single();

      if (!npc) return;

      const { id: _id, created_at: _ca, ...npcFields } = npc;

      const { data: newNpc, error: npcErr } = await supabase
        .from("npcs")
        .insert({
          ...npcFields,
          name: `${npcFields.name}（コピー）`,
        })
        .select()
        .single();

      if (npcErr || !newNpc) return;

      router.push(`/npcs/${newNpc.id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDuplicate}
      disabled={loading}
      className="flex items-center gap-1.5 rounded-lg border border-coc-border px-3 py-1.5 text-sm text-coc-muted hover:text-coc-text hover:border-coc-border-glow transition-colors disabled:opacity-50"
    >
      <Copy size={14} />
      {loading ? "複製中…" : "複製"}
    </button>
  );
}
