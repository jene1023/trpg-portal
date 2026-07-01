"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase, isSupabaseConfigured, CharacterSkill } from "@/lib/supabase";

type Props = { params: Promise<{ id: string }> };

type RollResult = {
  skillId: string;
  rolled: number;
  success: boolean;
  gain: number | null;
  oldValue: number;
  newValue: number;
};

export default function GrowthRollPage({ params }: Props) {
  const [characterId, setCharacterId] = useState<string>("");
  const [characterName, setCharacterName] = useState<string>("");
  const [skills, setSkills] = useState<CharacterSkill[]>([]);
  const [results, setResults] = useState<Record<string, RollResult>>({});
  const [sessionLabel, setSessionLabel] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(({ id }) => {
      setCharacterId(id);
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }
      Promise.all([
        supabase.from("characters").select("id, name").eq("id", id).single(),
        supabase
          .from("character_skills")
          .select("*")
          .eq("character_id", id)
          .eq("growth_checked", true)
          .order("skill_name"),
      ]).then(([charRes, skillsRes]) => {
        if (charRes.data) setCharacterName(charRes.data.name);
        setSkills(skillsRes.data ?? []);
        setLoading(false);
      });
    });
  }, [params]);

  async function roll(skill: CharacterSkill) {
    const rolled = Math.floor(Math.random() * 100) + 1;
    const success = rolled > skill.current_value;
    const gain = success ? Math.floor(Math.random() * 10) + 1 : null;
    const newValue = success ? skill.current_value + gain! : skill.current_value;
    const oldValue = skill.current_value;

    if (!isSupabaseConfigured) {
      setResults((prev) => ({
        ...prev,
        [skill.id]: { skillId: skill.id, rolled, success, gain, oldValue, newValue },
      }));
      return;
    }

    await supabase
      .from("character_skills")
      .update({ current_value: newValue, growth_checked: false })
      .eq("id", skill.id);

    if (success) {
      await supabase.from("growth_history").insert({
        character_id: characterId,
        skill_name: skill.skill_name,
        old_value: oldValue,
        new_value: newValue,
        session_label: sessionLabel || null,
        grown_at: new Date().toISOString(),
      });
    }

    setResults((prev) => ({
      ...prev,
      [skill.id]: { skillId: skill.id, rolled, success, gain, oldValue, newValue },
    }));

    setSkills((prev) =>
      prev.map((s) =>
        s.id === skill.id ? { ...s, current_value: newValue, growth_checked: false } : s
      )
    );
  }

  const pending = skills.filter((s) => !(s.id in results));
  const done = skills.filter((s) => s.id in results);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-coc-muted text-sm">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/characters/${characterId}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          {characterName || "キャラクター詳細"}
        </Link>
      </div>

      <h1 className="font-cinzel text-xl font-bold text-coc-text mb-2">技能成長判定</h1>
      <p className="text-xs text-coc-muted mb-6">
        成長チェック済みの技能に対して 1d100 を振り、現在値を超えれば 1d10 を加算します。
      </p>

      {skills.length === 0 && Object.keys(results).length === 0 ? (
        <div className="rounded-lg border border-coc-border coc-card-bg p-6 text-center">
          <p className="text-coc-muted text-sm">
            成長チェック済みの技能がありません。
          </p>
          <p className="text-xs text-coc-muted mt-2">
            技能一覧でチェックボックスを有効にすると成長判定できます。
          </p>
          <Link
            href={`/characters/${characterId}`}
            className="mt-4 inline-block text-sm text-coc-gold hover:underline"
          >
            キャラクター詳細へ戻る
          </Link>
        </div>
      ) : (
        <>
          {/* セッション名入力 */}
          <div className="mb-6">
            <label className="block text-xs text-coc-muted mb-1">
              セッション名（任意・成長履歴に記録されます）
            </label>
            <input
              type="text"
              value={sessionLabel}
              onChange={(e) => setSessionLabel(e.target.value)}
              placeholder="例: 第3回「忌まわしき屋敷」"
              className="w-full rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text placeholder-coc-muted focus:outline-none focus:border-coc-gold/60"
            />
          </div>

          {/* 判定待ち */}
          {pending.length > 0 && (
            <div className="mb-6 space-y-3">
              <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest">
                判定待ち ({pending.length}件)
              </h2>
              {pending.map((skill) => (
                <div
                  key={skill.id}
                  className="flex items-center justify-between rounded-lg border border-coc-border coc-card-bg px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-coc-text">{skill.skill_name}</p>
                    <p className="text-xs text-coc-muted">現在値: {skill.current_value}</p>
                  </div>
                  <button
                    onClick={() => roll(skill)}
                    className="rounded-lg border border-coc-gold/60 bg-coc-gold/10 px-4 py-1.5 text-sm font-semibold text-coc-gold hover:bg-coc-gold/20 transition-colors motion-safe:active:scale-[0.97]"
                  >
                    成長ロール
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 判定済み */}
          {done.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest">
                判定済み ({done.length}件)
              </h2>
              {done.map((skill) => {
                const r = results[skill.id];
                return (
                  <div
                    key={skill.id}
                    className={`rounded-lg border px-4 py-3 ${
                      r.success
                        ? "border-green-700/60 bg-green-950/20"
                        : "border-coc-border bg-coc-surface/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-coc-text">{skill.skill_name}</p>
                      {r.success ? (
                        <span className="rounded bg-green-900/60 border border-green-700 px-2 py-0.5 text-xs font-semibold text-green-300">
                          成長！
                        </span>
                      ) : (
                        <span className="rounded bg-coc-raised border border-coc-border px-2 py-0.5 text-xs text-coc-muted">
                          変化なし
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-coc-muted">
                      <span>
                        ロール: <span className="text-coc-text font-mono">{r.rolled}</span>
                      </span>
                      <span>
                        判定値: <span className="text-coc-text font-mono">{r.oldValue}</span>
                      </span>
                      {r.success && r.gain !== null && (
                        <>
                          <span>
                            加算: <span className="text-green-300 font-mono">+{r.gain}</span>
                          </span>
                          <span>
                            新値:{" "}
                            <span className="text-green-300 font-mono font-semibold">
                              {r.newValue}
                            </span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {pending.length === 0 && done.length > 0 && (
            <div className="mt-6 text-center">
              <p className="text-sm text-coc-muted mb-3">すべての成長判定が完了しました。</p>
              <Link
                href={`/characters/${characterId}`}
                className="inline-block rounded-lg border border-coc-gold/60 bg-coc-gold/10 px-6 py-2 text-sm font-semibold text-coc-gold hover:bg-coc-gold/20 transition-colors"
              >
                キャラクター詳細へ
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
