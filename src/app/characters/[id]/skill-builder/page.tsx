"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Character, CharacterSkill } from "@/lib/supabase";
import { OCCUPATIONS } from "@/lib/occupationData";

export default function SkillBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const [char, setChar] = useState<Character | null>(null);
  const [skills, setSkills] = useState<CharacterSkill[]>([]);
  const [selectedOcc, setSelectedOcc] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const load = async () => {
      const [{ data: charData }, { data: skillsData }] = await Promise.all([
        supabase.from("characters").select("*").eq("id", id).single(),
        supabase
          .from("character_skills")
          .select("*")
          .eq("character_id", id)
          .order("skill_name"),
      ]);
      setChar(charData ?? null);
      setSkills(skillsData ?? []);
      setLoading(false);
    };
    load();
  }, [id]);

  const handleValueChange = useCallback((skillId: string, raw: string) => {
    const val = parseInt(raw, 10);
    if (isNaN(val)) return;
    const clamped = Math.max(0, Math.min(99, val));
    setSkills((prev) =>
      prev.map((s) => (s.id === skillId ? { ...s, current_value: clamped } : s))
    );
  }, []);

  const handleValueBlur = useCallback(
    async (skillId: string) => {
      if (!isSupabaseConfigured) return;
      const skill = skills.find((s) => s.id === skillId);
      if (!skill) return;
      await supabase
        .from("character_skills")
        .update({ current_value: skill.current_value })
        .eq("id", skillId);
    },
    [skills]
  );

  const occ = OCCUPATIONS.find((o) => o.name === selectedOcc);
  const occMax = char && occ ? occ.calcPoints(char) : null;
  const hobbyMax = char ? char.int_stat * 2 : 0;

  const occSkills = skills.filter((s) => s.is_occupation);
  const hobbySkills = skills.filter((s) => !s.is_occupation);
  const occSpent = occSkills.reduce(
    (acc, s) => acc + Math.max(0, s.current_value - s.base_value),
    0
  );
  const hobbySpent = hobbySkills.reduce(
    (acc, s) => acc + Math.max(0, s.current_value - s.base_value),
    0
  );
  const occRemaining = occMax !== null ? occMax - occSpent : null;
  const hobbyRemaining = hobbyMax - hobbySpent;

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-coc-muted">Supabase が設定されていません。</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-coc-muted">読み込み中...</p>
      </div>
    );
  }

  if (!char) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-coc-muted">キャラクターが見つかりません。</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/characters/${id}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          {char.name}
        </Link>
      </div>

      <h1 className="font-cinzel text-xl font-bold text-coc-text mb-2">
        技能ポイント割り振り
      </h1>
      <p className="text-xs text-coc-muted mb-6">
        職業を選択すると職業技能ポイント上限が自動計算されます。技能値を入力するとリアルタイムで残りポイントが更新されます。フォーカスが外れたタイミングでDBに保存されます。
      </p>

      {/* 職業選択 + ポイントサマリー */}
      <div className="rounded-lg border border-coc-border coc-card-bg p-4 mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <label className="text-sm text-coc-muted whitespace-nowrap">
            職業を選択:
          </label>
          <select
            value={selectedOcc}
            onChange={(e) => setSelectedOcc(e.target.value)}
            className="flex-1 rounded-md border border-coc-border bg-coc-raised px-3 py-1.5 text-sm text-coc-text focus:outline-none focus:border-coc-border-glow"
          >
            <option value="">-- 職業を選択 --</option>
            {OCCUPATIONS.map((o) => (
              <option key={o.name} value={o.name}>
                {o.name}（{o.formulaLabel}）
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md border border-coc-border bg-coc-raised p-3">
            <p className="text-xs text-coc-muted mb-1">職業技能ポイント</p>
            {occMax !== null ? (
              <>
                <p
                  className="text-xl font-bold tabular-nums"
                  style={{
                    color:
                      (occRemaining ?? 0) < 0
                        ? "#ef4444"
                        : (occRemaining ?? 0) === 0
                        ? "#6b7280"
                        : "#a8936a",
                  }}
                >
                  残り {occRemaining}
                </p>
                <p className="text-xs text-coc-muted mt-0.5">
                  {occSpent} / {occMax} 使用（{occ?.formulaLabel}）
                </p>
              </>
            ) : (
              <p className="text-sm text-coc-muted">職業を選択してください</p>
            )}
          </div>
          <div className="rounded-md border border-coc-border bg-coc-raised p-3">
            <p className="text-xs text-coc-muted mb-1">趣味技能ポイント</p>
            <p
              className="text-xl font-bold tabular-nums"
              style={{
                color:
                  hobbyRemaining < 0
                    ? "#ef4444"
                    : hobbyRemaining === 0
                    ? "#6b7280"
                    : "#a8936a",
              }}
            >
              残り {hobbyRemaining}
            </p>
            <p className="text-xs text-coc-muted mt-0.5">
              {hobbySpent} / {hobbyMax} 使用（INT×2）
            </p>
          </div>
        </div>

        {((occRemaining !== null && occRemaining < 0) ||
          hobbyRemaining < 0) && (
          <p className="text-xs text-red-400 font-semibold">
            ⚠ 割り振りポイントが上限を超えています。技能値を見直してください。
          </p>
        )}
      </div>

      {/* 職業技能リスト */}
      <SkillSection
        title="職業技能"
        skills={occSkills}
        onValueChange={handleValueChange}
        onValueBlur={handleValueBlur}
      />

      {/* 趣味技能リスト */}
      <SkillSection
        title="趣味技能（その他）"
        skills={hobbySkills}
        onValueChange={handleValueChange}
        onValueBlur={handleValueBlur}
      />

      <div className="mt-4 rounded-lg border border-coc-border bg-coc-surface p-3 text-xs text-coc-muted space-y-1">
        <p>
          • 職業技能・趣味技能の分類は技能編集ページ（is_occupation フラグ）で変更できます。
        </p>
        <p>• 振分欄の数値は「現在値 − 基本値」の差分です。</p>
        <p>• 現在値は最低0、最大99の範囲に制限されます。</p>
      </div>
    </div>
  );
}

function SkillSection({
  title,
  skills,
  onValueChange,
  onValueBlur,
}: {
  title: string;
  skills: CharacterSkill[];
  onValueChange: (id: string, val: string) => void;
  onValueBlur: (id: string) => void;
}) {
  if (skills.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest mb-3">
        {title}
      </h2>
      <div className="rounded-lg border border-coc-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-coc-border bg-coc-raised">
              <th className="px-3 py-2 text-left text-xs text-coc-muted font-semibold">
                技能名
              </th>
              <th className="px-3 py-2 text-center text-xs text-coc-muted font-semibold w-20">
                基本値
              </th>
              <th className="px-3 py-2 text-center text-xs text-coc-muted font-semibold w-28">
                現在値
              </th>
              <th className="px-3 py-2 text-center text-xs text-coc-muted font-semibold w-20">
                振分
              </th>
            </tr>
          </thead>
          <tbody>
            {skills.map((skill, i) => {
              const spent = Math.max(0, skill.current_value - skill.base_value);
              return (
                <tr
                  key={skill.id}
                  className={`border-b border-coc-border/50 ${
                    i % 2 === 0 ? "bg-coc-surface" : "bg-coc-raised"
                  }`}
                >
                  <td className="px-3 py-2 text-coc-text">{skill.skill_name}</td>
                  <td className="px-3 py-2 text-center text-coc-muted tabular-nums">
                    {skill.base_value}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <input
                      type="number"
                      min={0}
                      max={99}
                      value={skill.current_value}
                      onChange={(e) => onValueChange(skill.id, e.target.value)}
                      onBlur={() => onValueBlur(skill.id)}
                      className="w-16 rounded border border-coc-border bg-coc-raised px-2 py-0.5 text-center text-sm text-coc-text tabular-nums focus:outline-none focus:border-coc-border-glow"
                    />
                  </td>
                  <td
                    className={`px-3 py-2 text-center font-semibold tabular-nums ${
                      spent > 0 ? "text-coc-gold" : "text-coc-muted"
                    }`}
                  >
                    {spent > 0 ? `+${spent}` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
