"use client";

import { useState } from "react";
import { CharacterSkill, supabase, isSupabaseConfigured } from "@/lib/supabase";

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

function getSkillCategory(skill: CharacterSkill): string {
  return skill.category || categorize(skill.skill_name);
}

type Props = { skills: CharacterSkill[]; characterId: string; sanCurrent?: number };

export default function SkillList({ skills, characterId, sanCurrent }: Props) {
  const cats = [...new Set(skills.map((s) => getSkillCategory(s)))].sort(
    (a, b) =>
      Object.keys(CATEGORIES).indexOf(a) - Object.keys(CATEGORIES).indexOf(b)
  );
  const [active, setActive] = useState(cats[0] ?? "その他");

  const [checkedMap, setCheckedMap] = useState<Record<string, boolean>>(
    () => Object.fromEntries(skills.map((s) => [s.id, s.growth_checked ?? false]))
  );
  const [favoriteMap, setFavoriteMap] = useState<Record<string, boolean>>(
    () => Object.fromEntries(skills.map((s) => [s.id, s.is_favorite ?? false]))
  );
  const [valueMap, setValueMap] = useState<Record<string, number>>(
    () => Object.fromEntries(skills.map((s) => [s.id, s.current_value]))
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStr, setEditStr] = useState<string>("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [showThresholds, setShowThresholds] = useState(false);

  function startEdit(skill: CharacterSkill) {
    setEditingId(skill.id);
    setEditStr(String(valueMap[skill.id] ?? skill.current_value));
  }

  async function commitEdit(skill: CharacterSkill) {
    const newVal = parseInt(editStr, 10);
    setEditingId(null);
    if (isNaN(newVal) || newVal < 0 || newVal > 100) return;
    const prev = valueMap[skill.id] ?? skill.current_value;
    if (newVal === prev) return;

    setValueMap((m) => ({ ...m, [skill.id]: newVal }));
    if (!isSupabaseConfigured) return;

    setSavingId(skill.id);
    await supabase
      .from("character_skills")
      .update({ current_value: newVal })
      .eq("id", skill.id);

    if (skill.skill_name.startsWith("クトゥルフ神話")) {
      const newSanMax = Math.max(0, 99 - newVal);
      const updates: Record<string, number> = { san_max: newSanMax };
      if (sanCurrent !== undefined && sanCurrent > newSanMax) {
        updates.san_current = newSanMax;
      }
      await supabase.from("characters").update(updates).eq("id", characterId);
    }

    setSavingId(null);
  }

  async function toggleGrowth(skillId: string) {
    const next = !checkedMap[skillId];
    setCheckedMap((m) => ({ ...m, [skillId]: next }));
    if (!isSupabaseConfigured) return;
    setSavingId(skillId);
    await supabase
      .from("character_skills")
      .update({ growth_checked: next })
      .eq("id", skillId)
      .eq("character_id", characterId);
    setSavingId(null);
  }

  async function toggleFavorite(skillId: string) {
    const next = !favoriteMap[skillId];
    setFavoriteMap((m) => ({ ...m, [skillId]: next }));
    if (!isSupabaseConfigured) return;
    await supabase
      .from("character_skills")
      .update({ is_favorite: next })
      .eq("id", skillId)
      .eq("character_id", characterId);
  }

  const visible = skills
    .filter((s) => getSkillCategory(s) === active)
    .sort((a, b) => b.current_value - a.current_value);

  if (skills.length === 0) {
    return (
      <p className="text-coc-muted text-sm italic">技能が登録されていません。</p>
    );
  }

  const checkedCount = Object.values(checkedMap).filter(Boolean).length;
  const favoriteCount = Object.values(favoriteMap).filter(Boolean).length;

  return (
    <div>
      {/* お気に入り件数バッジ */}
      {favoriteCount > 0 && (
        <p className="text-xs text-yellow-400 mb-1">
          ★ お気に入り: {favoriteCount}件 — ダイスローラーとクイックビューの先頭に表示されます
        </p>
      )}
      {/* 成長チェック数バッジ */}
      {checkedCount > 0 && (
        <p className="text-xs text-coc-gold mb-3">
          成長チェック済み: {checkedCount}件 — セッション後に成長判定を行ってください
        </p>
      )}

      {/* カテゴリタブ + 閾値表示トグル */}
      <div className="flex flex-wrap items-center gap-1 mb-4 border-b border-coc-border">
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
        <button
          onClick={() => setShowThresholds((v) => !v)}
          className={`ml-auto px-2 py-1 text-xs rounded border transition-colors -mb-px ${
            showThresholds
              ? "border-coc-gold text-coc-gold bg-coc-gold/10"
              : "border-coc-border text-coc-muted hover:text-coc-text"
          }`}
          title="困難・極限の閾値を表示"
        >
          閾値
        </button>
      </div>

      {/* 技能リスト */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {visible.map((skill) => {
          const isChecked = checkedMap[skill.id] ?? false;
          const isSaving = savingId === skill.id;
          return (
            <div
              key={skill.id}
              className={`flex items-center justify-between rounded-md border px-3 py-2 transition-colors ${
                isChecked
                  ? "bg-coc-raised border-coc-gold/40"
                  : "bg-coc-raised border-coc-border"
              }`}
            >
              <div className="min-w-0">
                <span
                  className={`text-sm truncate block ${
                    skill.is_occupation ? "text-coc-gold font-medium" : "text-coc-text"
                  }`}
                >
                  {skill.is_occupation && (
                    <span className="text-coc-gold-dim mr-1">★</span>
                  )}
                  {skill.skill_name}
                </span>
                {showThresholds && (
                  <span className="text-xs text-coc-muted tabular-nums">
                    困難: {Math.floor((valueMap[skill.id] ?? skill.current_value) / 2)}　極限: {Math.floor((valueMap[skill.id] ?? skill.current_value) / 5)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 ml-2 shrink-0">
                {/* お気に入りトグル */}
                <button
                  onClick={() => toggleFavorite(skill.id)}
                  aria-label={`${skill.skill_name} お気に入り`}
                  title="お気に入りに追加/解除"
                  className={`text-base leading-none transition-colors ${
                    favoriteMap[skill.id]
                      ? "text-yellow-400"
                      : "text-coc-muted hover:text-yellow-400/60"
                  }`}
                >
                  ☆
                </button>
                <span className="text-xs text-coc-muted tabular-nums">
                  基{skill.base_value}
                </span>
                {editingId === skill.id ? (
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editStr}
                    onChange={(e) => setEditStr(e.target.value)}
                    onBlur={() => commitEdit(skill)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitEdit(skill);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    autoFocus
                    className="w-14 text-sm font-bold text-center rounded border border-coc-gold bg-coc-raised text-coc-text tabular-nums focus:outline-none focus:ring-1 focus:ring-coc-gold px-1"
                  />
                ) : (
                  <button
                    onClick={() => startEdit(skill)}
                    title="クリックして値を編集"
                    className={`text-sm font-bold tabular-nums hover:text-coc-gold transition-colors ${
                      skill.skill_name.startsWith("クトゥルフ神話")
                        ? "text-purple-400"
                        : "text-coc-text"
                    }`}
                  >
                    {valueMap[skill.id] ?? skill.current_value}%
                  </button>
                )}
                {/* 成長チェックボックス */}
                <button
                  onClick={() => toggleGrowth(skill.id)}
                  disabled={isSaving}
                  aria-label={`${skill.skill_name} 成長チェック`}
                  title="成長チェック"
                  className={`w-5 h-5 rounded border flex items-center justify-center text-xs transition-colors disabled:opacity-40 ${
                    isChecked
                      ? "border-coc-gold bg-coc-gold/20 text-coc-gold"
                      : "border-coc-border text-coc-muted hover:border-coc-gold/60"
                  }`}
                >
                  {isChecked ? "✓" : ""}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-coc-muted mt-3">
        ☆ = お気に入り（クイックロール先頭表示）　✓ = 成長チェック（セッション後に技能判定に失敗した技能にチェック）
      </p>
    </div>
  );
}
