"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type Props = {
  snapshotId: string;
  characterId: string;
  label: string;
  snapshotData: Record<string, unknown>;
};

export default function SnapshotRestoreButton({ characterId, label, snapshotData }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);

  async function handleRestore() {
    if (!isSupabaseConfigured) return;
    setLoading(true);
    try {
      const data = snapshotData as {
        hp_current?: number;
        hp_max?: number;
        mp_current?: number;
        mp_max?: number;
        san_current?: number;
        san_max?: number;
        san_start?: number;
        luck?: number;
        str?: number;
        con?: number;
        pow?: number;
        dex?: number;
        app?: number;
        siz?: number;
        int_stat?: number;
        edu?: number;
        character_skills?: Array<{
          id: string;
          skill_name: string;
          current_value: number;
          base_value: number;
          is_occupation: boolean;
          growth_checked: boolean;
          is_favorite: boolean;
          category: string | null;
        }>;
      };

      await supabase.from("characters").update({
        hp_current: data.hp_current,
        hp_max: data.hp_max,
        mp_current: data.mp_current,
        mp_max: data.mp_max,
        san_current: data.san_current,
        san_max: data.san_max,
        san_start: data.san_start,
        luck: data.luck,
        str: data.str,
        con: data.con,
        pow: data.pow,
        dex: data.dex,
        app: data.app,
        siz: data.siz,
        int_stat: data.int_stat,
        edu: data.edu,
      }).eq("id", characterId);

      if (data.character_skills && data.character_skills.length > 0) {
        for (const skill of data.character_skills) {
          await supabase
            .from("character_skills")
            .update({
              current_value: skill.current_value,
              base_value: skill.base_value,
              is_occupation: skill.is_occupation,
              growth_checked: skill.growth_checked,
              is_favorite: skill.is_favorite,
              category: skill.category,
            })
            .eq("id", skill.id);
        }
      }

      router.push(`/characters/${characterId}`);
      router.refresh();
    } finally {
      setLoading(false);
      setConfirm(false);
    }
  }

  if (confirm) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-yellow-800 bg-yellow-950/20 p-3">
        <p className="text-xs text-yellow-300 font-semibold">
          「{label}」のデータに復元しますか？
        </p>
        <p className="text-xs text-coc-muted">HP・MP・SAN・能力値・技能値が上書きされます。この操作は取り消せません。</p>
        <div className="flex gap-2">
          <button
            onClick={handleRestore}
            disabled={loading}
            className="flex-1 rounded-lg border border-yellow-700 bg-yellow-900/40 px-3 py-1.5 text-sm text-yellow-200 hover:bg-yellow-900/60 transition-colors disabled:opacity-50"
          >
            {loading ? "復元中…" : "復元する"}
          </button>
          <button
            onClick={() => setConfirm(false)}
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
      onClick={() => setConfirm(true)}
      className="flex items-center gap-2 rounded-lg border border-coc-border bg-coc-raised px-3 py-1.5 text-sm text-coc-muted hover:text-coc-text hover:border-coc-border-glow transition-colors w-full"
    >
      <RotateCcw size={14} />
      この状態に復元する
    </button>
  );
}
