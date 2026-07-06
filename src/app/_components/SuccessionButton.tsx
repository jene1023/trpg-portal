"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase, isSupabaseConfigured, Character } from "@/lib/supabase";

type Props = {
  currentCharacterId: string;
  currentCharacterName: string;
};

export default function SuccessionButton({ currentCharacterId, currentCharacterName }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [characters, setCharacters] = useState<Pick<Character, "id" | "name" | "status">[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [inheritItems, setInheritItems] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmInherit, setConfirmInherit] = useState(false);

  useEffect(() => {
    if (!open || !isSupabaseConfigured) return;
    supabase
      .from("characters")
      .select("id, name, status")
      .neq("id", currentCharacterId)
      .order("name")
      .then(({ data }) => setCharacters((data ?? []) as Pick<Character, "id" | "name" | "status">[]));
  }, [open, currentCharacterId]);

  async function handleSet() {
    if (!selectedId || !isSupabaseConfigured) return;
    if (inheritItems && !confirmInherit) {
      setConfirmInherit(true);
      return;
    }
    setLoading(true);
    await supabase
      .from("characters")
      .update({ successor_of: currentCharacterId })
      .eq("id", selectedId);

    if (inheritItems) {
      await supabase
        .from("inventory_items")
        .update({ character_id: selectedId })
        .eq("character_id", currentCharacterId);
    }

    setLoading(false);
    setOpen(false);
    setConfirmInherit(false);
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-between w-full rounded-lg border border-coc-border bg-coc-surface px-4 py-3 text-sm text-coc-muted hover:text-coc-text hover:border-coc-border-glow transition-colors motion-safe:active:scale-[0.98]"
      >
        <span>後継者を設定する</span>
        <span className="text-coc-gold">→</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-sm rounded-xl border border-coc-border bg-coc-surface p-6 shadow-2xl space-y-4">
            <h2 className="font-cinzel text-base font-semibold text-coc-text">
              後継者を設定
            </h2>
            <p className="text-xs text-coc-muted leading-relaxed">
              <span className="text-coc-text font-semibold">{currentCharacterName}</span> の後継となるキャラクターを選択してください。
              後継者の詳細ページに「前任探索者」リンクが表示されます。
            </p>

            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full rounded-md border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text focus:outline-none focus:border-coc-gold"
            >
              <option value="">後継者を選択…</option>
              {characters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.status !== "alive" ? ` (${c.status === "dead" ? "死亡" : c.status === "retired" ? "引退" : c.status})` : ""}
                </option>
              ))}
            </select>

            <label className="flex items-center gap-2 text-sm text-coc-muted cursor-pointer">
              <input
                type="checkbox"
                checked={inheritItems}
                onChange={(e) => {
                  setInheritItems(e.target.checked);
                  setConfirmInherit(false);
                }}
                className="rounded"
              />
              前任者の所持品を後継者へ引き継ぐ
            </label>

            {confirmInherit && (
              <p className="text-xs text-amber-400 border border-amber-800 rounded-md bg-amber-950/20 px-3 py-2 leading-relaxed">
                ⚠️ 所持品の引き継ぎは取り消せません。<span className="font-semibold">{currentCharacterName}</span> のすべての所持品が後継者へ移転されます。「設定する」をもう一度押すと実行されます。
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => { setOpen(false); setConfirmInherit(false); setSelectedId(""); setInheritItems(false); }}
                className="flex-1 rounded-md border border-coc-border px-3 py-2 text-sm text-coc-muted hover:text-coc-text transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleSet}
                disabled={!selectedId || loading}
                className="flex-1 rounded-md border border-coc-gold/60 bg-coc-gold/10 px-3 py-2 text-sm text-coc-gold hover:bg-coc-gold/20 transition-colors disabled:opacity-40"
              >
                {loading ? "処理中…" : confirmInherit ? "確認して設定する" : "設定する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
