"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Brain } from "lucide-react";

type CharacterEntry = {
  id: string;
  name: string;
  sanCurrent: number;
  sanMax: number;
};

type RollResult = {
  character: CharacterEntry;
  roll: number;
  success: boolean;
  loss: number;
  sanBefore: number;
  sanAfter: number;
};

function rollDiceFormula(formula: string): number {
  const trimmed = formula.trim().toLowerCase();
  const match = trimmed.match(/^(\d*)d(\d+)([+-]\d+)?$/);
  if (!match) {
    const flat = parseInt(trimmed, 10);
    return Number.isFinite(flat) ? Math.max(0, flat) : 0;
  }
  const count = match[1] ? parseInt(match[1], 10) : 1;
  const sides = parseInt(match[2], 10);
  const mod = match[3] ? parseInt(match[3], 10) : 0;
  let sum = 0;
  for (let i = 0; i < count; i++) {
    sum += Math.floor(Math.random() * sides) + 1;
  }
  return Math.max(0, sum + mod);
}

type Props = {
  characters: CharacterEntry[];
};

export default function PartySanCheck({ characters }: Props) {
  const [currentSans, setCurrentSans] = useState<Record<string, number>>(
    Object.fromEntries(characters.map((c) => [c.id, c.sanCurrent]))
  );
  const [successFormula, setSuccessFormula] = useState("0");
  const [failureFormula, setFailureFormula] = useState("1d4");
  const [results, setResults] = useState<RollResult[] | null>(null);
  const [rolling, setRolling] = useState(false);

  async function runCheck() {
    if (rolling || characters.length === 0) return;
    setRolling(true);

    const rollResults: RollResult[] = characters.map((char) => {
      const sanCurrent = currentSans[char.id] ?? char.sanCurrent;
      const roll = Math.floor(Math.random() * 100) + 1;
      const success = roll <= sanCurrent;
      const loss = rollDiceFormula(success ? successFormula : failureFormula);
      const sanBefore = sanCurrent;
      const sanAfter = Math.max(0, sanBefore - loss);
      return { character: char, roll, success, loss, sanBefore, sanAfter };
    });

    const newSans: Record<string, number> = { ...currentSans };
    for (const r of rollResults) {
      newSans[r.character.id] = r.sanAfter;
    }
    setCurrentSans(newSans);
    setResults(rollResults);

    if (isSupabaseConfigured) {
      await Promise.all(
        rollResults.map((r) =>
          supabase
            .from("characters")
            .update({ san_current: r.sanAfter })
            .eq("id", r.character.id)
        )
      );
    }

    setRolling(false);
  }

  if (characters.length === 0) return null;

  return (
    <div className="mt-8 rounded-xl border border-coc-border bg-coc-surface px-5 py-5">
      <div className="flex items-center gap-2 mb-4">
        <Brain size={16} className="text-coc-gold" />
        <h2 className="font-medium text-coc-text text-sm">一括SANチェック</h2>
        <span className="text-xs text-coc-muted">（神話生物遭遇・恐怖イベント）</span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-xs text-coc-muted block mb-1">成功時喪失（式）</label>
          <input
            type="text"
            value={successFormula}
            onChange={(e) => setSuccessFormula(e.target.value)}
            placeholder="例: 0"
            className="w-full rounded-md border border-coc-border bg-coc-bg text-coc-text text-sm px-2 py-1.5 focus:outline-none focus:border-coc-gold"
          />
        </div>
        <div>
          <label className="text-xs text-coc-muted block mb-1">失敗時喪失（式）</label>
          <input
            type="text"
            value={failureFormula}
            onChange={(e) => setFailureFormula(e.target.value)}
            placeholder="例: 1d4"
            className="w-full rounded-md border border-coc-border bg-coc-bg text-coc-text text-sm px-2 py-1.5 focus:outline-none focus:border-coc-gold"
          />
        </div>
      </div>

      <button
        onClick={runCheck}
        disabled={rolling}
        className="w-full flex items-center justify-center gap-1.5 rounded-md border border-coc-gold text-coc-gold px-3 py-2 text-sm font-medium hover:bg-coc-gold/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Brain size={14} className={rolling ? "animate-pulse" : ""} />
        {rolling ? "判定中…" : `全員一括SANチェック（${characters.length}名）`}
      </button>

      {results && (
        <div className="mt-4 space-y-2">
          <p className="text-xs text-coc-muted font-medium">判定結果</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-coc-muted border-b border-coc-border">
                  <th className="pb-2 pr-3">キャラクター</th>
                  <th className="pb-2 pr-3 text-center">ロール</th>
                  <th className="pb-2 pr-3 text-center">判定</th>
                  <th className="pb-2 pr-3 text-center">喪失</th>
                  <th className="pb-2 text-center">SAN推移</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr
                    key={r.character.id}
                    className="border-b border-coc-border/50 last:border-0"
                  >
                    <td className="py-2 pr-3 font-medium text-coc-text">
                      {r.character.name}
                    </td>
                    <td
                      className={`py-2 pr-3 text-center font-cinzel font-bold ${
                        r.success ? "text-green-400" : "text-red-500"
                      }`}
                    >
                      {r.roll}
                    </td>
                    <td
                      className={`py-2 pr-3 text-center text-xs font-medium ${
                        r.success ? "text-green-400" : "text-red-500"
                      }`}
                    >
                      {r.success ? "成功" : "失敗"}
                    </td>
                    <td className="py-2 pr-3 text-center text-coc-text">
                      -{r.loss}
                    </td>
                    <td className="py-2 text-center text-xs text-coc-muted">
                      {r.sanBefore}
                      {"→"}
                      <span
                        className={
                          r.sanAfter === 0
                            ? "text-red-400 font-bold"
                            : r.loss >= 5
                            ? "text-yellow-400 font-medium"
                            : "text-coc-text"
                        }
                      >
                        {r.sanAfter}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {results.some((r) => r.sanAfter === 0 || r.loss >= 5) && (
            <div className="mt-3 space-y-1.5">
              <p className="text-xs text-red-400 font-medium">狂気記録を追加すべきキャラクター:</p>
              {results
                .filter((r) => r.sanAfter === 0 || r.loss >= 5)
                .map((r) => (
                  <Link
                    key={r.character.id}
                    href={`/characters/${r.character.id}/madness`}
                    className="flex items-center justify-between rounded-md border border-red-700 bg-red-950/30 px-3 py-2 text-sm text-red-300 hover:text-red-200 hover:border-red-600 transition-colors"
                  >
                    <span>
                      {r.character.name}
                      {r.sanAfter === 0
                        ? " — SANが0になりました"
                        : ` — ${r.loss}ポイント喪失`}
                    </span>
                    <span>→ 狂気記録</span>
                  </Link>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
