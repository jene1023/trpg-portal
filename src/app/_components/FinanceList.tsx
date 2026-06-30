"use client";

import { useState } from "react";
import { supabase, isSupabaseConfigured, CharacterFinance } from "@/lib/supabase";

type Props = {
  characterId: string;
  initialFinances: CharacterFinance[];
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ja-JP");
}

export default function FinanceList({ characterId, initialFinances }: Props) {
  const [finances, setFinances] = useState<CharacterFinance[]>(initialFinances);
  const [amount, setAmount] = useState<string>("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const inputClass =
    "w-full rounded-md border border-coc-border bg-coc-void px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:outline-none focus:border-coc-gold";

  const balance = finances.reduce((sum, f) => sum + f.amount, 0);

  async function save(e: React.FormEvent, sign: 1 | -1) {
    e.preventDefault();
    if (amount === "" || !reason.trim()) return;
    if (!isSupabaseConfigured) return;

    setSaving(true);
    const { data, error } = await supabase
      .from("character_finances")
      .insert({
        character_id: characterId,
        amount: sign * Math.abs(Number(amount)),
        reason: reason.trim(),
        recorded_at: new Date().toISOString(),
      })
      .select()
      .single();
    setSaving(false);

    if (!error && data) {
      setFinances((prev) => [data as CharacterFinance, ...prev]);
      setAmount("");
      setReason("");
    }
  }

  async function remove(id: string) {
    if (!isSupabaseConfigured) return;
    await supabase.from("character_finances").delete().eq("id", id);
    setFinances((prev) => prev.filter((f) => f.id !== id));
  }

  return (
    <div className="space-y-4">
      {/* 残高表示 */}
      <div className="rounded-lg border border-coc-border bg-coc-surface p-4 text-center">
        <p className="text-xs text-coc-muted mb-1">現在の所持金</p>
        <p className={`font-cinzel text-3xl font-bold ${balance < 0 ? "text-red-400" : "text-coc-gold"}`}>
          {balance.toLocaleString()}
        </p>
      </div>

      {/* 追加フォーム */}
      <form className="rounded-lg border border-coc-border bg-coc-surface p-4 space-y-3">
        <h3 className="font-cinzel text-sm font-semibold text-coc-gold tracking-widest">
          収支を記録する
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-coc-muted block mb-1">金額</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={inputClass}
              min={0}
              placeholder="例: 1000"
              required
            />
          </div>
          <div>
            <label className="text-xs text-coc-muted block mb-1">理由</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={inputClass}
              placeholder="例: 報酬 / 装備購入"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={(e) => save(e, 1)}
            disabled={saving || amount === "" || !reason.trim()}
            className="w-full rounded-lg bg-coc-gold text-black font-semibold text-sm py-2 disabled:opacity-40 hover:brightness-110 transition-all"
          >
            {saving ? "保存中…" : "収入として記録"}
          </button>
          <button
            type="button"
            onClick={(e) => save(e, -1)}
            disabled={saving || amount === "" || !reason.trim()}
            className="w-full rounded-lg border border-coc-border text-coc-text font-semibold text-sm py-2 disabled:opacity-40 hover:border-coc-border-glow transition-all"
          >
            {saving ? "保存中…" : "出費として記録"}
          </button>
        </div>
      </form>

      {/* ログ一覧 */}
      {finances.length === 0 ? (
        <p className="text-sm text-coc-muted text-center py-4">収支記録はまだありません。</p>
      ) : (
        <div className="space-y-2">
          {finances.map((f) => (
            <div
              key={f.id}
              className="rounded-lg border border-coc-border bg-coc-surface p-3 flex gap-3 items-center"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-bold text-sm ${f.amount < 0 ? "text-red-400" : "text-coc-gold"}`}>
                    {f.amount > 0 ? "+" : ""}
                    {f.amount.toLocaleString()}
                  </span>
                  <span className="text-sm text-coc-text">{f.reason}</span>
                </div>
                <time className="text-xs text-coc-muted mt-1 block">
                  {formatDate(f.recorded_at)}
                </time>
              </div>
              <button
                onClick={() => remove(f.id)}
                className="shrink-0 text-coc-muted hover:text-red-400 text-xs transition-colors"
              >
                削除
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
