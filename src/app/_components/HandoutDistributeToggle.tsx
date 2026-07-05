"use client";

import { useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type Props = {
  handoutId: string;
  initialDistributed: boolean;
};

export default function HandoutDistributeToggle({ handoutId, initialDistributed }: Props) {
  const [isDistributed, setIsDistributed] = useState(initialDistributed);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!isSupabaseConfigured) return;
    setLoading(true);
    const next = !isDistributed;
    await supabase.from("handouts").update({ is_distributed: next }).eq("id", handoutId);
    setIsDistributed(next);
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`text-xs font-semibold px-2 py-0.5 rounded-full border transition-colors ${
        isDistributed
          ? "border-green-700 bg-green-950/40 text-green-300 hover:bg-green-950/60"
          : "border-yellow-700 bg-yellow-950/40 text-yellow-300 hover:bg-yellow-950/60"
      }`}
    >
      {isDistributed ? "配布済み" : "未配布"}
    </button>
  );
}
