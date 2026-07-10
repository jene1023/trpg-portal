"use client";

import { useState, useEffect } from "react";
import { Brain, X, ChevronDown } from "lucide-react";
import Link from "next/link";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

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

type ScenarioOption = { id: string; title: string };

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
  sanLossSuccess: string | null;
  sanLossFailure: string | null;
};

export default function CreatureSanCheckButton({ sanLossSuccess, sanLossFailure }: Props) {
  const [open, setOpen] = useState(false);
  const [scenarios, setScenarios] = useState<ScenarioOption[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>("");
  const [successFormula, setSuccessFormula] = useState(sanLossSuccess ?? "0");
  const [failureFormula, setFailureFormula] = useState(sanLossFailure ?? "1d4");
  const [characters, setCharacters] = useState<CharacterEntry[]>([]);
  const [results, setResults] = useState<RollResult[] | null>(null);
  const [rolling, setRolling] = useState(false);
  const [loadingScenarios, setLoadingScenarios] = useState(false);
  const [loadingChars, setLoadingChars] = useState(false);

  useEffect(() => {
    if (!open || !isSupabaseConfigured) return;
    setLoadingScenarios(true);
    supabase
      .from("scenarios")
      .select("id, title")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setScenarios((data ?? []) as ScenarioOption[]);
        setLoadingScenarios(false);
      });
  }, [open]);

  useEffect(() => {
    if (!selectedScenarioId) {
      setCharacters([]);
      return;
    }
    if (!isSupabaseConfigured) return;
    setLoadingChars(true);
    setResults(null);
    supabase
      .from("scenario_participants")
      .select("*, characters(id, name, san_current, san_max)")
      .eq("scenario_id", selectedScenarioId)
      .then(({ data }) => {
        const entries: CharacterEntry[] = (data ?? [])
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((p: any) => {
            const c = p.characters;
            if (!c) return null;
            return { id: c.id, name: c.name, sanCurrent: c.san_current, sanMax: c.san_max };
          })
          .filter(Boolean) as CharacterEntry[];
        setCharacters(entries);
        setLoadingChars(false);
      });
  }, [selectedScenarioId]);

  async function runCheck() {
    if (rolling || characters.length === 0) return;
    setRolling(true);

    const rollResults: RollResult[] = characters.map((char) => {
      const roll = Math.floor(Math.random() * 100) + 1;
      const success = roll <= char.sanCurrent;
      const loss = rollDiceFormula(success ? successFormula : failureFormula);
      const sanBefore = char.sanCurrent;
      const sanAfter = Math.max(0, sanBefore - loss);
      return { character: char, roll, success, loss, sanBefore, sanAfter };
    });

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

  function handleClose() {
    setOpen(false);
    setResults(null);
    setSelectedScenarioId("");
    setCharacters([]);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-red-700 bg-red-950/20 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-950/40 transition-colors"
      >
        <Brain size={15} />
        パーティーSANチェック
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={handleClose}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-coc-border bg-coc-bg shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-coc-border px-5 py-4">
              <div className="flex items-center gap-2">
                <Brain size={18} className="text-red-400" />
                <h2 className="font-cinzel font-bold text-coc-text">パーティーSANチェック</h2>
              </div>
              <button
                onClick={handleClose}
                className="text-coc-muted hover:text-coc-text transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-coc-muted mb-1">シナリオを選択</label>
                <div className="relative">
                  <select
                    value={selectedScenarioId}
                    onChange={(e) => setSelectedScenarioId(e.target.value)}
                    disabled={loadingScenarios}
                    className="w-full appearance-none rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text pr-8 focus:border-coc-gold focus:outline-none disabled:opacity-50"
                  >
                    <option value="">
                      {loadingScenarios ? "読み込み中..." : "シナリオを選択してください"}
                    </option>
                    {scenarios.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-coc-muted pointer-events-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-coc-muted block mb-1">成功時喪失（式）</label>
                  <input
                    type="text"
                    value={successFormula}
                    onChange={(e) => setSuccessFormula(e.target.value)}
                    placeholder="例: 0"
                    className="w-full rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text focus:border-coc-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-coc-muted block mb-1">失敗時喪失（式）</label>
                  <input
                    type="text"
                    value={failureFormula}
                    onChange={(e) => setFailureFormula(e.target.value)}
                    placeholder="例: 1d4"
                    className="w-full rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text focus:border-coc-gold focus:outline-none"
                  />
                </div>
              </div>

              {selectedScenarioId && (
                <div className="text-xs text-coc-muted">
                  {loadingChars ? (
                    <span className="animate-pulse">参加者を読み込み中...</span>
                  ) : characters.length === 0 ? (
                    <span>このシナリオには参加者がいません。</span>
                  ) : (
                    <span>参加者: {characters.map((c) => c.name).join("、")}</span>
                  )}
                </div>
              )}

              <button
                onClick={runCheck}
                disabled={rolling || characters.length === 0}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-red-700 bg-red-950/20 text-red-400 px-3 py-2 text-sm font-medium hover:bg-red-950/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Brain size={14} className={rolling ? "animate-pulse" : ""} />
                {rolling
                  ? "判定中…"
                  : `全員一括SANチェック${characters.length > 0 ? `（${characters.length}名）` : ""}`}
              </button>

              {results && (
                <div className="space-y-2">
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
                            <td className="py-2 pr-3 text-center text-coc-text">-{r.loss}</td>
                            <td className="py-2 text-center text-xs text-coc-muted">
                              {r.sanBefore}→
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
                    <div className="space-y-1.5 pt-1">
                      <p className="text-xs text-red-400 font-medium">
                        狂気記録を追加すべきキャラクター:
                      </p>
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
                              {r.sanAfter === 0 ? " — SANが0" : ` — ${r.loss}pt喪失`}
                            </span>
                            <span>→ 狂気記録</span>
                          </Link>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
