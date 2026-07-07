"use client";

import { useState, useEffect } from "react";
import { Brain, X } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

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

type ScenarioOption = { id: string; title: string };

type ParticipantResult = {
  characterId: string;
  characterName: string;
  roll: number;
  success: boolean;
  loss: number;
  sanBefore: number;
  sanAfter: number;
};

type Props = {
  sanLossSuccess: string | null;
  sanLossFailure: string | null;
};

export default function CreatureSanCheckButton({ sanLossSuccess, sanLossFailure }: Props) {
  const [open, setOpen] = useState(false);
  const [scenarios, setScenarios] = useState<ScenarioOption[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState("");
  const [results, setResults] = useState<ParticipantResult[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !isSupabaseConfigured) return;
    supabase
      .from("scenarios")
      .select("id, title")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        const opts = (data ?? []) as ScenarioOption[];
        setScenarios(opts);
        if (opts.length > 0 && !selectedScenarioId) {
          setSelectedScenarioId(opts[0].id);
        }
      });
  }, [open, selectedScenarioId]);

  async function runChecks() {
    if (!selectedScenarioId || !isSupabaseConfigured) return;
    setLoading(true);
    setResults(null);

    const { data: participants } = await supabase
      .from("scenario_participants")
      .select("character_id, characters(id, name, san_current, san_max)")
      .eq("scenario_id", selectedScenarioId);

    type Row = {
      character_id: string;
      characters: { id: string; name: string; san_current: number; san_max: number } | null;
    };

    const rows = (participants ?? []) as Row[];
    const successFormula = sanLossSuccess?.trim() || "0";
    const failureFormula = sanLossFailure?.trim() || "1d4";

    const newResults: ParticipantResult[] = rows
      .filter((p) => p.characters !== null)
      .map((p) => {
        const char = p.characters!;
        const roll = Math.floor(Math.random() * 100) + 1;
        const success = roll <= char.san_current;
        const loss = rollDiceFormula(success ? successFormula : failureFormula);
        return {
          characterId: char.id,
          characterName: char.name,
          roll,
          success,
          loss,
          sanBefore: char.san_current,
          sanAfter: Math.max(0, char.san_current - loss),
        };
      });

    await Promise.all(
      newResults.map((r) =>
        supabase
          .from("characters")
          .update({ san_current: r.sanAfter })
          .eq("id", r.characterId)
      )
    );

    setResults(newResults);
    setLoading(false);
  }

  function handleClose() {
    setOpen(false);
    setResults(null);
  }

  if (!sanLossSuccess && !sanLossFailure) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border border-red-800 bg-red-950/20 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-950/40 transition-colors"
      >
        <Brain size={15} />
        パーティーSANチェック
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-xl border border-coc-border bg-coc-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-coc-border px-5 py-4">
              <h2 className="font-cinzel text-sm font-semibold text-coc-text uppercase tracking-widest">
                パーティーSANチェック
              </h2>
              <button
                onClick={handleClose}
                className="text-coc-muted hover:text-coc-text transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="rounded-md border border-red-900/50 bg-red-950/20 px-4 py-3 text-sm space-y-1">
                <p className="text-xs text-coc-muted mb-1">このクリーチャーのSAN喪失</p>
                <p className="text-coc-text">
                  成功: <span className="font-semibold text-green-400">{sanLossSuccess ?? "0"}</span>
                  {"　/　"}
                  失敗: <span className="font-semibold text-red-400">{sanLossFailure ?? "—"}</span>
                </p>
              </div>

              <div>
                <label className="text-xs text-coc-muted block mb-1.5">シナリオを選択</label>
                {scenarios.length === 0 ? (
                  <p className="text-sm text-coc-muted">シナリオが見つかりません</p>
                ) : (
                  <select
                    value={selectedScenarioId}
                    onChange={(e) => { setSelectedScenarioId(e.target.value); setResults(null); }}
                    className="w-full rounded-md border border-coc-border bg-coc-raised text-coc-text text-sm px-3 py-2 focus:outline-none focus:border-coc-gold"
                  >
                    {scenarios.map((s) => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>
                )}
              </div>

              <button
                onClick={runChecks}
                disabled={loading || !selectedScenarioId}
                className="w-full rounded-md border border-red-700 bg-red-950/20 py-2 text-sm font-medium text-red-400 hover:bg-red-950/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? "判定中…" : results ? "再判定" : "全員SANチェック実行"}
              </button>

              {results !== null && (
                <div className="space-y-2">
                  <p className="text-xs text-coc-muted">
                    判定結果 — {results.length} 名のSANを更新しました
                  </p>

                  {results.length === 0 ? (
                    <p className="text-sm text-coc-muted">このシナリオに参加者がいません</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="border-b border-coc-border text-xs text-coc-muted">
                            <th className="text-left pb-2 font-medium">キャラクター</th>
                            <th className="text-center pb-2 font-medium">ロール</th>
                            <th className="text-center pb-2 font-medium">判定</th>
                            <th className="text-center pb-2 font-medium">喪失</th>
                            <th className="text-center pb-2 font-medium">SAN</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.map((r) => (
                            <tr key={r.characterId} className="border-b border-coc-border/30">
                              <td className="py-2 text-coc-text">{r.characterName}</td>
                              <td className="text-center py-2 font-cinzel font-bold text-coc-text">
                                {r.roll}
                              </td>
                              <td className={`text-center py-2 text-xs font-semibold ${r.success ? "text-green-400" : "text-red-400"}`}>
                                {r.success ? "成功" : "失敗"}
                              </td>
                              <td className="text-center py-2 text-coc-text font-medium">{r.loss}</td>
                              <td className="text-center py-2 text-xs text-coc-muted">
                                {r.sanBefore}
                                {" → "}
                                <span className={r.sanAfter < r.sanBefore ? "text-red-400 font-semibold" : "text-coc-text"}>
                                  {r.sanAfter}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {results.some((r) => r.loss >= 5 || r.sanAfter === 0) && (
                    <p className="rounded-md border border-red-800 bg-red-950/20 px-3 py-2 text-xs text-red-400">
                      ⚠ 5以上のSAN喪失またはSAN0のキャラクターがいます。各キャラの狂気記録への追加を検討してください。
                    </p>
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
