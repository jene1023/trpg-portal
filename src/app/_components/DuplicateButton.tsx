"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type Props = { characterId: string };

export default function DuplicateButton({ characterId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDuplicate() {
    if (!isSupabaseConfigured) return;
    setLoading(true);
    try {
      const { data: char } = await supabase
        .from("characters")
        .select("*, character_skills(*)")
        .eq("id", characterId)
        .single();

      if (!char) return;

      const { character_skills: skills, id: _id, created_at: _ca, updated_at: _ua, ...charFields } = char;

      const { data: newChar, error: charErr } = await supabase
        .from("characters")
        .insert({ ...charFields, name: `${charFields.name}（コピー）`, is_pinned: false })
        .select()
        .single();

      if (charErr || !newChar) return;

      if (skills && skills.length > 0) {
        const newSkills = skills.map(
          ({ id: _sid, character_id: _cid, created_at: _sca, ...s }: {
            id: string;
            character_id: string;
            created_at?: string;
            [key: string]: unknown;
          }) => ({
            ...s,
            character_id: newChar.id,
            growth_checked: false,
          })
        );
        await supabase.from("character_skills").insert(newSkills);
      }

      router.push(`/characters/${newChar.id}`);
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
