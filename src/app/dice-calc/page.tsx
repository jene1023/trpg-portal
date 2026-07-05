"use client";

import { useState, useCallback } from "react";

type RollType = "normal" | "bonus" | "penalty";

interface RateResult {
  criticalSuccess: number;
  success: number;
  normalSuccess: number;
  failure: number;
  fumble: number;
}

function calcRates(skill: number, rollType: RollType): RateResult {
  const s = Math.min(Math.max(skill, 0), 99);

  // 決定的成功閾値（1/5以下）
  const critThreshold = Math.floor(s / 5);
  // ファンブル閾値（96〜100かつ技能値50未満は96〜100、技能値50以上は100のみ）
  const fumbleStart = s < 50 ? 96 : 100;

  // 100面ロールの各出目の確率
  // normalSuccess: クリット以外の成功（critThreshold+1 〜 s）
  // 通常判定
  const critRate = critThreshold / 100;
  const successRate = s / 100; // クリット含む全成功
  const fumbleRate = (101 - fumbleStart) / 100;

  if (rollType === "normal") {
    const criticalSuccess = critRate;
    const success = successRate;
    const normalSuccess = successRate - critRate;
    const fumble = fumbleRate;
    const failure = 1 - successRate - fumble;
    return { criticalSuccess, success, normalSuccess, failure, fumble };
  }

  if (rollType === "bonus") {
    // 十の位を2つ振り小さい方を採用
    // P(最終値 <= x) = 1 - (1 - x/100)^2  ただし一の位はそのまま
    // 近似: P(成功) = 1 - (1 - successRate)^2
    const pSuccessBonus = 1 - Math.pow(1 - successRate, 2);
    const pCritBonus = 1 - Math.pow(1 - critRate, 2);
    const pFumbleBonus = Math.pow(fumbleRate, 2);
    const normalSuccess = pSuccessBonus - pCritBonus;
    const failure = 1 - pSuccessBonus - pFumbleBonus;
    return {
      criticalSuccess: pCritBonus,
      success: pSuccessBonus,
      normalSuccess,
      failure: Math.max(0, failure),
      fumble: pFumbleBonus,
    };
  }

  // penalty: 十の位を2つ振り大きい方を採用
  // P(成功) = successRate^2
  const pSuccessPenalty = Math.pow(successRate, 2);
  const pCritPenalty = Math.pow(critRate, 2);
  const pFumblePenalty = 1 - Math.pow(1 - fumbleRate, 2);
  const normalSuccess = pSuccessPenalty - pCritPenalty;
  const failure = 1 - pSuccessPenalty - pFumblePenalty;
  return {
    criticalSuccess: pCritPenalty,
    success: pSuccessPenalty,
    normalSuccess,
    failure: Math.max(0, failure),
    fumble: pFumblePenalty,
  };
}

function pct(v: number) {
  return (v * 100).toFixed(1) + "%";
}

interface BarProps {
  value: number;
  color: string;
  label: string;
  detail: string;
}

function Bar({ value, color, label, detail }: BarProps) {
  const width = Math.min(Math.max(value * 100, 0), 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-coc-text font-medium">{label}</span>
        <span className="text-coc-gold font-bold">{pct(value)}</span>
      </div>
      <div className="h-5 w-full rounded-full bg-coc-surface overflow-hidden border border-coc-border">
        <div
          className={`h-full rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${width}%` }}
        />
      </div>
      <p className="text-xs text-coc-muted">{detail}</p>
    </div>
  );
}

export default function DiceCalcPage() {
  const [skill, setSkill] = useState(50);
  const [rollType, setRollType] = useState<RollType>("normal");

  const result = calcRates(skill, rollType);

  const handleSlider = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSkill(Number(e.target.value));
  }, []);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value, 10);
    if (!isNaN(v)) setSkill(Math.min(Math.max(v, 0), 99));
  }, []);

  const critThreshold = Math.floor(skill / 5);
  const fumbleStart = skill < 50 ? 96 : 100;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-2 font-cinzel text-2xl font-bold text-coc-gold">
        ダイス成功率シミュレーター
      </h1>
      <p className="mb-8 text-sm text-coc-muted">
        技能値と判定種別から成功確率を即座に計算します。
      </p>

      {/* 入力セクション */}
      <div className="coc-card mb-8 space-y-6">
        {/* 技能値 */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <label className="text-sm font-semibold text-coc-text">技能値</label>
            <input
              type="number"
              min={0}
              max={99}
              value={skill}
              onChange={handleInput}
              className="w-20 rounded-lg border border-coc-border bg-coc-surface px-3 py-1.5 text-center text-lg font-bold text-coc-gold focus:border-coc-gold focus:outline-none"
            />
          </div>
          <input
            type="range"
            min={0}
            max={99}
            value={skill}
            onChange={handleSlider}
            className="w-full accent-amber-500"
          />
          <div className="mt-1 flex justify-between text-xs text-coc-muted">
            <span>0</span>
            <span>99</span>
          </div>
        </div>

        {/* 判定種別 */}
        <div>
          <label className="mb-3 block text-sm font-semibold text-coc-text">
            判定種別
          </label>
          <div className="flex gap-3">
            {(
              [
                { value: "normal", label: "通常判定" },
                { value: "bonus", label: "ボーナスダイス" },
                { value: "penalty", label: "ペナルティダイス" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRollType(opt.value)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  rollType === opt.value
                    ? "border-coc-gold bg-coc-gold/10 text-coc-gold"
                    : "border-coc-border bg-coc-surface text-coc-muted hover:text-coc-text"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 閾値メモ */}
        <div className="rounded-lg bg-coc-surface/50 border border-coc-border p-3 text-xs text-coc-muted space-y-1">
          <p>決定的成功: <span className="text-coc-gold font-medium">1 〜 {critThreshold}</span></p>
          <p>通常成功: <span className="text-coc-text font-medium">{critThreshold + 1} 〜 {skill}</span></p>
          <p>失敗: <span className="text-coc-text font-medium">{skill + 1} 〜 {fumbleStart - 1}</span></p>
          <p>ファンブル: <span className="text-red-400 font-medium">{fumbleStart} 〜 100</span></p>
        </div>
      </div>

      {/* 結果セクション */}
      <div className="coc-card space-y-5">
        <h2 className="text-base font-semibold text-coc-text">確率</h2>

        <Bar
          value={result.criticalSuccess}
          color="bg-amber-400"
          label="決定的成功"
          detail={`技能値 ${skill} の 1/5 以下（1〜${critThreshold}）`}
        />
        <Bar
          value={result.normalSuccess}
          color="bg-green-500"
          label="通常成功"
          detail={`${critThreshold + 1}〜${skill} の範囲（クリット除く）`}
        />
        <Bar
          value={result.failure}
          color="bg-slate-500"
          label="失敗"
          detail={`${skill + 1}〜${fumbleStart - 1} の範囲`}
        />
        <Bar
          value={result.fumble}
          color="bg-red-600"
          label="ファンブル"
          detail={skill < 50 ? "96〜100（技能値50未満）" : "100のみ（技能値50以上）"}
        />

        {/* 合計成功率 */}
        <div className="border-t border-coc-border pt-4">
          <div className="flex justify-between">
            <span className="text-sm font-semibold text-coc-text">合計成功率</span>
            <span className="text-lg font-bold text-coc-gold">{pct(result.success)}</span>
          </div>
          <p className="mt-1 text-xs text-coc-muted">
            決定的成功 {pct(result.criticalSuccess)} + 通常成功 {pct(result.normalSuccess)}
          </p>
        </div>
      </div>

      {/* 説明 */}
      <div className="mt-6 rounded-lg border border-coc-border bg-coc-surface/30 p-4 text-xs text-coc-muted space-y-2">
        <p className="font-semibold text-coc-text text-sm">判定種別について</p>
        <p><span className="text-coc-text">通常判定:</span> 1d100 を1回振り、技能値以下なら成功。</p>
        <p><span className="text-coc-text">ボーナスダイス:</span> 十の位d10を2つ振り小さい方を採用（有利）。成功率が上昇。</p>
        <p><span className="text-coc-text">ペナルティダイス:</span> 十の位d10を2つ振り大きい方を採用（不利）。成功率が低下。</p>
      </div>
    </div>
  );
}
