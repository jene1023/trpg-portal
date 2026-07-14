"use client";

import { useState } from "react";
import { Users, Plus, Trash2, X } from "lucide-react";

const MAX_HELPERS = 4;

function calcResults(leadSkill: number, helperSkills: number[]) {
  const helperBonus = helperSkills.reduce((sum, s) => sum + Math.floor(s / 5), 0);
  const raw = leadSkill + helperBonus;
  const cap = leadSkill * 2;
  const finalValue = Math.min(raw, cap);
  return {
    finalValue,
    normalSuccess: finalValue,
    hardSuccess: Math.floor(finalValue / 2),
    extremeSuccess: Math.floor(finalValue / 5),
    isCapped: raw > cap,
  };
}

export default function CombinedRollHelper() {
  const [open, setOpen] = useState(false);
  const [leadSkill, setLeadSkill] = useState(50);
  const [helperSkills, setHelperSkills] = useState<number[]>([]);

  const addHelper = () => {
    if (helperSkills.length < MAX_HELPERS) {
      setHelperSkills([...helperSkills, 30]);
    }
  };

  const removeHelper = (idx: number) => {
    setHelperSkills(helperSkills.filter((_: number, i: number) => i !== idx));
  };

  const updateHelper = (idx: number, val: number) => {
    const next = [...helperSkills];
    next[idx] = val;
    setHelperSkills(next);
  };

  const results = calcResults(leadSkill, helperSkills);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text hover:border-coc-gold hover:text-coc-gold transition-colors"
      >
        <Users size={14} />
        組み合わせ判定
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="relative w-full max-w-md rounded-2xl border border-coc-border bg-coc-bg shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-coc-border">
              <div className="flex items-center gap-2 text-coc-text">
                <Users size={16} className="text-coc-gold" />
                <span className="font-semibold text-sm">組み合わせ判定計算（CoC 7版）</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-coc-muted hover:text-coc-text transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-xs text-coc-muted mb-1.5">リード役の技能値</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={leadSkill}
                    onChange={(e) => setLeadSkill(Math.max(1, Math.min(99, Number(e.target.value) || 1)))}
                    className="w-24 rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-coc-text text-sm text-right focus:outline-none focus:border-coc-gold"
                  />
                  <span className="text-xs text-coc-muted">（上限: {leadSkill * 2}）</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs text-coc-muted">補助者の技能値（各1/5を加算）</label>
                  <span className="text-xs text-coc-muted">{helperSkills.length}/{MAX_HELPERS}名</span>
                </div>
                <div className="space-y-2">
                  {helperSkills.map((val, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs text-coc-muted w-12">補助 {idx + 1}</span>
                      <input
                        type="number"
                        min={1}
                        max={99}
                        value={val}
                        onChange={(e) => updateHelper(idx, Math.max(1, Math.min(99, Number(e.target.value) || 1)))}
                        className="w-20 rounded-lg border border-coc-border bg-coc-surface px-3 py-1.5 text-coc-text text-sm text-right focus:outline-none focus:border-coc-gold"
                      />
                      <span className="text-xs text-coc-muted">→ +{Math.floor(val / 5)}</span>
                      <button
                        onClick={() => removeHelper(idx)}
                        className="ml-auto text-coc-muted hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {helperSkills.length < MAX_HELPERS && (
                    <button
                      onClick={addHelper}
                      className="flex items-center gap-1 text-xs text-coc-gold hover:text-coc-text transition-colors"
                    >
                      <Plus size={13} />
                      補助者を追加
                    </button>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-coc-border bg-coc-surface px-4 py-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-coc-text">最終判定値</span>
                  <span className="text-2xl font-bold text-coc-gold font-cinzel">
                    {results.finalValue}
                    {results.isCapped && <span className="text-xs text-coc-muted ml-1">（上限適用）</span>}
                  </span>
                </div>
                <div className="border-t border-coc-border pt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-coc-muted">通常成功ライン</span>
                    <span className="text-green-400 font-semibold">{results.normalSuccess} 以下</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-coc-muted">ハード成功ライン</span>
                    <span className="text-yellow-400 font-semibold">{results.hardSuccess} 以下</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-coc-muted">決定的成功ライン</span>
                    <span className="text-red-400 font-semibold">{results.extremeSuccess} 以下</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-coc-muted">
                計算式: リード技能値 + Σ（補助者技能値 ÷ 5 切り捨て）、上限 = リード技能値 × 2
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
