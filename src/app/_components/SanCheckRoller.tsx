"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { sendDiscordWebhook } from "@/lib/discordWebhook";
import { Brain } from "lucide-react";

type Props = {
  characterId: string;
  sanCurrent: number;
  sanMax: number;
  characterName?: string;
  discordWebhookUrl?: string | null;
};

type Result = {
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

function rollD100(): number {
  const value = Math.floor(Math.random() * 100) + 1;
  return value;
}

export default function SanCheckRoller({ characterId, sanCurrent, sanMax, characterName, discordWebhookUrl }: Props) {
  const [san, setSan] = useState(sanCurrent);
  const [successFormula, setSuccessFormula] = useState("0");
  const [failureFormula, setFailureFormula] = useState("1d4");
  const [result, setResult] = useState<Result | null>(null);
  const [rolling, setRolling] = useState(false);

  async function check() {
    if (rolling) return;
    setRolling(true);

    const roll = rollD100();
    const success = roll <= san;
    const loss = rollDiceFormula(success ? successFormula : failureFormula);
    const sanBefore = san;
    const sanAfter = Math.max(0, sanBefore - loss);

    setSan(sanAfter);
    setResult({ roll, success, loss, sanBefore, sanAfter });
    setRolling(false);

    if (isSupabaseConfigured) {
      await supabase
        .from("characters")
        .update({ san_current: sanAfter })
        .eq("id", characterId);
    }

    if (discordWebhookUrl) {
      const label = characterName ? `**${characterName}**` : "探索者";
      const result_label = success ? "✅ 成功" : "❌ 失敗";
      await sendDiscordWebhook(
        discordWebhookUrl,
        `🧠 ${label} SANチェック — 1d100 → **${roll}** / 目標値 ${sanBefore} → ${result_label}　喪失: **${loss}** (SAN: ${sanBefore} → ${sanAfter})`
      );
    }
  }

  const showMadnessPrompt = result !== null && (result.sanAfter === 0 || result.loss >= 5);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-coc-muted block mb-1">成功時喪失（式）</label>
          <input
            type="text"
            value={successFormula}
            onChange={(e) => setSuccessFormula(e.target.value)}
            placeholder="例: 0"
            className="w-full rounded-md border border-coc-border bg-coc-raised text-coc-text text-sm px-2 py-1.5 focus:outline-none focus:border-coc-gold"
          />
        </div>
        <div>
          <label className="text-xs text-coc-muted block mb-1">失敗時喪失（式）</label>
          <input
            type="text"
            value={failureFormula}
            onChange={(e) => setFailureFormula(e.target.value)}
            placeholder="例: 1d4"
            className="w-full rounded-md border border-coc-border bg-coc-raised text-coc-text text-sm px-2 py-1.5 focus:outline-none focus:border-coc-gold"
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-coc-muted">
          現在SAN <span className="font-bold text-coc-text">{san}</span> / {sanMax}
        </span>
        <button
          onClick={check}
          disabled={rolling}
          className="flex items-center gap-1.5 rounded-md border border-coc-gold text-coc-gold px-3 py-1.5 text-sm font-medium hover:bg-coc-gold/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          <Brain size={14} className={rolling ? "animate-pulse" : ""} />
          SANチェック
        </button>
      </div>

      {result && (
        <div
          className={`rounded-md border px-4 py-3 space-y-2 transition-all ${
            result.success ? "border-green-500 bg-green-500/5" : "border-red-600 bg-red-600/5"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-coc-muted mb-0.5">
                目標値 {result.sanBefore} 以下で成功
              </p>
              <p className={`font-bold text-base ${result.success ? "text-green-400" : "text-red-500"}`}>
                {result.success ? "成功" : "失敗"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-coc-muted mb-0.5">ロール</p>
              <p className={`font-cinzel text-2xl font-bold ${result.success ? "text-green-400" : "text-red-500"}`}>
                {result.roll}
              </p>
            </div>
          </div>
          <p className="text-sm text-coc-text">
            SAN喪失: <span className="font-bold">{result.loss}</span>
            {"　"}（{result.sanBefore} → {result.sanAfter}）
          </p>

          {showMadnessPrompt && (
            <Link
              href={`/characters/${characterId}/madness`}
              className="flex items-center justify-between rounded-md border border-red-700 bg-red-950/30 px-3 py-2 text-sm text-red-300 hover:text-red-200 hover:border-red-600 transition-colors"
            >
              <span>
                {result.sanAfter === 0 ? "SANが0になりました。" : "5以上のSANを喪失しました。"}
                狂気記録を追加しますか？
              </span>
              <span>→</span>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
