"use client";

import { useState } from "react";
import { CharacterSkill } from "@/lib/supabase";

const CATEGORIES: Record<string, string[]> = {
  戦闘:   ["近接戦闘（格闘）", "近接戦闘", "回避", "拳銃", "ライフル/ショットガン", "自動火器", "投擲", "弓", "フレイル"],
  探索:   ["目星", "聞き耳", "図書館", "追跡", "ナビゲート", "登攀"],
  対人:   ["説得", "言いくるめ", "魅惑", "威圧", "心理学", "人類学"],
  知識:   ["クトゥルフ神話", "歴史", "オカルト", "法律", "医学", "薬学", "生物学", "地質学", "天文学", "博物学", "電気修理", "電子工学", "機械修理", "コンピューター", "乗馬", "操縦", "重機操縦"],
  移動:   ["水泳", "潜水", "跳躍", "飛行"],
  芸術:   ["芸術・工芸", "写真術"],
  言語:   ["母国語", "他の言語", "読唇術"],
  その他: [],
};

function categorize(skillName: string): string {
  for (const [cat, names] of Object.entries(CATEGORIES)) {
    if (cat === "その他") continue;
    if (names.some((n) => skillName.startsWith(n))) return cat;
  }
  return "その他";
}

type Props = { skills: CharacterSkill[] };

export default function SkillList({ skills }: Props) {
  const cats = [...new Set(skills.map((s) => categorize(s.skill_name)))].sort(
    (a, b) =>
      Object.keys(CATEGORIES).indexOf(a) - Object.keys(CATEGORIES).indexOf(b)
  );
  const [active, setActive] = useState(cats[0] ?? "その他");

  const visible = skills
    .filter((s) => categorize(s.skill_name) === active)
    .sort((a, b) => b.current_value - a.current_value);

  if (skills.length === 0) {
    return (
      <p className="text-coc-muted text-sm italic">技能が登録されていません。</p>
    );
  }

  return (
    <div>
      {/* カテゴリタブ */}
      <div className="flex flex-wrap gap-1 mb-4 border-b border-coc-border">
        {cats.map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className={`px-3 py-1.5 text-xs font-medium transition-colors border-b-2 -mb-px ${
              active === cat
                ? "border-coc-gold text-coc-gold"
                : "border-transparent text-coc-muted hover:text-coc-text"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 技能リスト */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {visible.map((skill) => (
          <div
            key={skill.id}
            className="flex items-center justify-between rounded-md bg-coc-raised border border-coc-border px-3 py-2"
          >
            <span
              className={`text-sm truncate ${
                skill.is_occupation ? "text-coc-gold font-medium" : "text-coc-text"
              }`}
            >
              {skill.is_occupation && (
                <span className="text-coc-gold-dim mr-1">★</span>
              )}
              {skill.skill_name}
            </span>
            <div className="flex items-center gap-2 ml-2 shrink-0">
              <span className="text-xs text-coc-muted tabular-nums">
                基{skill.base_value}
              </span>
              <span className="text-sm font-bold text-coc-text tabular-nums">
                {skill.current_value}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
