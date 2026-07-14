"use client";

import { useState } from "react";
import { CharacterSkill } from "@/lib/supabase";

type SkillProb = {
  skill: CharacterSkill;
  critical: number;
  regular: number;
  failure: number;
  fumble: number;
};

function calcProbs(v: number): { critical: number; regular: number; failure: number; fumble: number } {
  const capped = Math.min(Math.max(v, 0), 100);
  const critical = Math.floor(capped / 5);
  const regular = Math.max(capped - critical, 0);
  const failure = Math.max(95 - capped, 0);
  const fumble = 5;
  return { critical, regular, failure, fumble };
}

type Props = {
  skills: CharacterSkill[];
};

const CATEGORY_ORDER = [
  "戦闘",
  "探索",
  "対人",
  "知識",
  "行動",
  "操作",
  "その他",
  null,
];

export default function SkillProbChart({ skills }: Props) {
  const [hideUnder20, setHideUnder20] = useState(false);

  const probs: SkillProb[] = skills.map((skill) => ({
    skill,
    ...calcProbs(skill.current_value),
  }));

  const filtered = hideUnder20
    ? probs.filter((p) => p.skill.current_value >= 20)
    : probs;

  const sorted = [...filtered].sort((a, b) => {
    const catA = CATEGORY_ORDER.indexOf(a.skill.category as string);
    const catB = CATEGORY_ORDER.indexOf(b.skill.category as string);
    const idxA = catA === -1 ? CATEGORY_ORDER.length - 1 : catA;
    const idxB = catB === -1 ? CATEGORY_ORDER.length - 1 : catB;
    if (idxA !== idxB) return idxA - idxB;
    return b.skill.current_value - a.skill.current_value;
  });

  const grouped = new Map<string, SkillProb[]>();
  for (const p of sorted) {
    const key = p.skill.category ?? "その他";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(p);
  }

  if (skills.length === 0) {
    return (
      <div className="rounded-lg border border-coc-border bg-coc-surface p-8 text-center text-coc-muted text-sm">
        技能データがまだ登録されていません。
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 凡例 + フィルター */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3 text-xs text-coc-muted">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-yellow-400 inline-block" />
            決定的成功
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-green-500 inline-block" />
            通常成功
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-slate-600 inline-block" />
            失敗
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-red-600 inline-block" />
            致命的失敗
          </span>
        </div>
        <label className="flex items-center gap-2 text-sm text-coc-muted cursor-pointer select-none">
          <input
            type="checkbox"
            checked={hideUnder20}
            onChange={(e) => setHideUnder20(e.target.checked)}
            className="rounded border-coc-border accent-coc-gold"
          />
          低確率技能を非表示（20未満）
        </label>
      </div>

      {/* カテゴリー別 */}
      {[...grouped.entries()].map(([category, items]) => (
        <div key={category} className="rounded-lg border border-coc-border bg-coc-surface p-4 space-y-3">
          <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest">
            {category}
          </h2>
          <div className="space-y-3">
            {items.map(({ skill, critical, regular, failure, fumble }) => (
              <div key={skill.id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-coc-text font-medium truncate max-w-[55%]">
                    {skill.skill_name}
                    {skill.is_occupation && (
                      <span className="ml-1.5 rounded bg-coc-gold/20 border border-coc-gold/40 px-1 py-0.5 text-[10px] text-coc-gold">
                        職業
                      </span>
                    )}
                  </span>
                  <span className="text-coc-muted tabular-nums text-xs shrink-0">
                    現在値 {skill.current_value}
                    {" / "}
                    <span className="text-green-400">成功 {critical + regular}%</span>
                  </span>
                </div>
                {/* 4色横バー */}
                <div className="h-3 rounded-full bg-coc-raised overflow-hidden flex" title={`決定的: ${critical}% / 通常: ${regular}% / 失敗: ${failure}% / ファンブル: ${fumble}%`}>
                  {critical > 0 && (
                    <div
                      className="h-full bg-yellow-400"
                      style={{ width: `${critical}%` }}
                      title={`決定的成功: ${critical}%`}
                    />
                  )}
                  {regular > 0 && (
                    <div
                      className="h-full bg-green-500"
                      style={{ width: `${regular}%` }}
                      title={`通常成功: ${regular}%`}
                    />
                  )}
                  {failure > 0 && (
                    <div
                      className="h-full bg-slate-600"
                      style={{ width: `${failure}%` }}
                      title={`失敗: ${failure}%`}
                    />
                  )}
                  <div
                    className="h-full bg-red-600"
                    style={{ width: `${fumble}%` }}
                    title={`致命的失敗: ${fumble}%`}
                  />
                </div>
                <div className="flex text-[10px] text-coc-muted gap-2">
                  <span className="text-yellow-400">決定的 {critical}%</span>
                  <span className="text-green-400">通常 {regular}%</span>
                  <span>失敗 {failure}%</span>
                  <span className="text-red-400">ファンブル {fumble}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
