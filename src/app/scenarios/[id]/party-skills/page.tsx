"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart2, AlertTriangle } from "lucide-react";
import { supabase, isSupabaseConfigured, CharacterSkill } from "@/lib/supabase";

type Props = { params: Promise<{ id: string }> };

type CharacterEntry = {
  id: string;
  name: string;
  skills: CharacterSkill[];
};

type SkillRow = {
  skillName: string;
  maxValue: number;
  holders: { charName: string; value: number }[];
};

const CATEGORY_ORDER = ["探索", "戦闘", "対人", "知識", "移動", "芸術", "言語", "その他"];

const CATEGORY_SKILL_NAMES: Record<string, string[]> = {
  戦闘: ["近接戦闘（格闘）", "近接戦闘", "回避", "拳銃", "ライフル/ショットガン", "自動火器", "投擲", "弓", "フレイル"],
  探索: ["目星", "聞き耳", "図書館", "追跡", "ナビゲート", "登攀"],
  対人: ["説得", "言いくるめ", "魅惑", "威圧", "心理学", "人類学"],
  知識: ["クトゥルフ神話", "歴史", "オカルト", "法律", "医学", "薬学", "生物学", "地質学", "天文学", "博物学", "電気修理", "電子工学", "機械修理", "コンピューター", "乗馬", "操縦", "重機操縦"],
  移動: ["水泳", "潜水", "跳躍", "飛行"],
  芸術: ["芸術・工芸", "写真術"],
  言語: ["母国語", "他の言語", "読唇術"],
  その他: [],
};

function categorizeSkill(skill: CharacterSkill): string {
  if (skill.category) return skill.category;
  for (const [cat, names] of Object.entries(CATEGORY_SKILL_NAMES)) {
    if (cat === "その他") continue;
    if (names.some((n) => skill.skill_name.startsWith(n))) return cat;
  }
  return "その他";
}

export default function PartySkillsPage({ params }: Props) {
  const [scenarioId, setScenarioId] = useState("");
  const [scenarioTitle, setScenarioTitle] = useState("");
  const [characters, setCharacters] = useState<CharacterEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    params.then(({ id }) => {
      setScenarioId(id);
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }

      Promise.all([
        supabase.from("scenarios").select("title").eq("id", id).single(),
        supabase
          .from("scenario_participants")
          .select("id, characters(id, name, character_skills(*))")
          .eq("scenario_id", id),
      ]).then(([{ data: scenario }, { data: participantRows }]) => {
        setScenarioTitle(scenario?.title ?? "");

        const chars: CharacterEntry[] = [];
        for (const p of participantRows ?? []) {
          const ch = (p as unknown as { characters: { id: string; name: string; character_skills: CharacterSkill[] } | null }).characters;
          if (ch && ch.id) {
            chars.push({ id: ch.id, name: ch.name, skills: ch.character_skills ?? [] });
          }
        }
        setCharacters(chars);
        setLoading(false);
      });
    });
  }, [params]);

  const allSkillNames: string[] = Array.from(
    new Set(characters.flatMap((c: CharacterEntry) => c.skills.map((s: CharacterSkill) => s.skill_name)))
  );

  const skillRows: SkillRow[] = allSkillNames.map((skillName: string): SkillRow => {
    const holders = characters
      .map((c: CharacterEntry) => {
        const sk = c.skills.find((s: CharacterSkill) => s.skill_name === skillName);
        return sk ? { charName: c.name, value: sk.current_value } : null;
      })
      .filter((h: { charName: string; value: number } | null): h is { charName: string; value: number } => h !== null)
      .sort((a: { charName: string; value: number }, b: { charName: string; value: number }) => b.value - a.value);
    const maxValue = holders.length > 0 ? holders[0].value : 0;
    return { skillName, maxValue, holders };
  });

  const filteredRows = search.trim()
    ? skillRows.filter((r) => r.skillName.includes(search.trim()))
    : skillRows;

  const grouped: Record<string, SkillRow[]> = {};
  for (const row of filteredRows) {
    const firstChar = characters.find((c: CharacterEntry) =>
      c.skills.some((s: CharacterSkill) => s.skill_name === row.skillName)
    );
    const sampleSkill = firstChar?.skills.find((s: CharacterSkill) => s.skill_name === row.skillName);
    const cat = sampleSkill ? categorizeSkill(sampleSkill) : "その他";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(row);
  }

  const categories = CATEGORY_ORDER.filter((cat) => grouped[cat] && grouped[cat].length > 0);

  return (
    <div className="coc-page-enter mx-auto max-w-2xl px-4 py-8">
      <Link
        href={`/scenarios/${scenarioId}`}
        className="mb-6 flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
      >
        <ArrowLeft size={16} />
        シナリオ詳細
      </Link>

      <div className="mb-6">
        {scenarioTitle && <p className="text-xs text-coc-muted mb-1">{scenarioTitle}</p>}
        <div className="flex items-center gap-2">
          <BarChart2 size={20} className="text-coc-gold" />
          <h1 className="font-cinzel text-xl font-bold text-coc-text">パーティスキルカバレッジ</h1>
        </div>
        <p className="text-sm text-coc-muted mt-1">
          カバーされていない技能を事前に確認（KP用）
        </p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-12 text-center">
          <p className="text-coc-muted text-sm">読み込み中...</p>
        </div>
      ) : characters.length === 0 ? (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-12 text-center">
          <p className="text-coc-muted">参加キャラクターが登録されていません。</p>
          <Link
            href={`/scenarios/${scenarioId}/participants`}
            className="mt-3 inline-block text-sm text-coc-gold hover:underline"
          >
            参加者を追加する →
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <input
              type="text"
              placeholder="技能名で絞り込み..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-coc-border bg-coc-surface px-4 py-2 text-sm text-coc-text placeholder-coc-muted focus:border-coc-gold focus:outline-none"
            />
          </div>

          <div className="mb-3 flex items-center gap-3 text-xs text-coc-muted">
            <span className="flex items-center gap-1">
              <AlertTriangle size={12} className="text-yellow-400" />
              最高値が50未満
            </span>
            <span>— パーティ内で誰も高くカバーできていない技能</span>
          </div>

          {categories.length === 0 ? (
            <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-8 text-center text-sm text-coc-muted">
              該当する技能が見つかりません。
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {categories.map((cat) => (
                <div key={cat} className="rounded-xl border border-coc-border bg-coc-surface overflow-hidden">
                  <div className="border-b border-coc-border bg-coc-raised px-4 py-2">
                    <p className="text-xs font-semibold text-coc-gold uppercase tracking-widest">{cat}</p>
                  </div>
                  <div className="divide-y divide-coc-border">
                    {grouped[cat].map((row) => {
                      const isWeak = row.maxValue < 50;
                      return (
                        <div key={row.skillName} className="flex items-start gap-3 px-4 py-2.5">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-sm font-medium ${isWeak ? "text-yellow-300" : "text-coc-text"}`}>
                                {row.skillName}
                              </span>
                              {isWeak && (
                                <span className="flex items-center gap-1 rounded-full border border-yellow-700 bg-yellow-950/40 px-1.5 py-0.5 text-xs text-yellow-400">
                                  <AlertTriangle size={10} />
                                  未カバー
                                </span>
                              )}
                            </div>
                            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                              {row.holders.map((h, i) => (
                                <span key={i} className="text-xs text-coc-muted">
                                  {h.charName}:{" "}
                                  <span className={h.value === row.maxValue && row.holders.length > 1 ? "font-semibold text-coc-gold" : "text-coc-text"}>
                                    {h.value}
                                  </span>
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <span className={`text-base font-bold tabular-nums ${isWeak ? "text-yellow-400" : "text-green-400"}`}>
                              {row.maxValue}
                            </span>
                            <p className="text-xs text-coc-muted">最高値</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="mt-4 text-xs text-coc-muted text-center">
            最高値が緑: 50以上（カバー済み） / 黄: 50未満（要注意）
          </p>
        </>
      )}
    </div>
  );
}
