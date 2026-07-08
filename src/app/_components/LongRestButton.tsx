"use client";

import { useState } from "react";
import { Moon } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type Props = {
  characterId: string;
  hpMax: number;
  mpMax: number;
  sanMax: number;
};

export default function LongRestButton({ characterId, hpMax, mpMax, sanMax }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleRest() {
    if (!isSupabaseConfigured) return;
    setLoading(true);
    try {
      await supabase
        .from("characters")
        .update({ hp_current: hpMax, mp_current: mpMax, san_current: sanMax })
        .eq("id", characterId);
      setDone(true);
      setConfirming(false);
      setTimeout(() => setDone(false), 3000);
    } finally {
      setLoading(false);
    }
  }

  if (confirming) {
    return (
      <div className="rounded-lg border border-coc-gold/40 bg-coc-gold/5 p-4 space-y-3">
        <p className="text-sm text-coc-text font-semibold">ロングレストを実行しますか？</p>
        <p className="text-xs text-coc-muted">
          HP・MP・SANをすべて最大値に回復します。
          <br />HP: {hpMax} / MP: {mpMax} / SAN: {sanMax}
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleRest}
            disabled={loading}
            className="flex-1 rounded-lg border border-coc-gold/50 bg-coc-gold/10 px-3 py-1.5 text-sm text-coc-gold hover:bg-coc-gold/20 transition-colors disabled:opacity-50"
          >
            {loading ? "回復中…" : "実行する"}
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="rounded-lg border border-coc-border px-3 py-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
          >
            キャンセル
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-colors w-full ${
        done
          ? "border-green-700 bg-green-950/20 text-green-300"
          : "border-blue-700/50 bg-blue-950/10 text-blue-300 hover:border-blue-600/70 hover:bg-blue-950/20"
      }`}
    >
      <Moon size={16} />
      {done ? "HP / MP / SAN を最大値に回復しました" : "ロングレスト（HP・MP・SAN 全回復）"}
    </button>
  );
}
