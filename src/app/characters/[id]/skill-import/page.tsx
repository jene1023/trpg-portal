"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase, isSupabaseConfigured, CharacterSkill } from "@/lib/supabase";
import { normalizeSkillName } from "@/lib/skillNormalizer";

type Props = { params: Promise<{ id: string }> };

type ParsedSkill = {
  raw_name: string;
  normalized_name: string;
  current_value: number;
};

function parseSkillText(text: string): ParsedSkill[] {
  const results: ParsedSkill[] = [];
  const seen = new Set<string>();

  const regex = /([^\d,、\n\t]+?)\s*(\d{1,3})(?=[\s,、\n\t]|$)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    let rawName = match[1].trim().replace(/[：:・\s]+$/, "").trim();
    const value = parseInt(match[2], 10);

    if (!rawName || isNaN(value) || value < 0 || value > 100) continue;

    const normalizedName = normalizeSkillName(rawName);
    if (seen.has(normalizedName)) continue;
    seen.add(normalizedName);

    results.push({ raw_name: rawName, normalized_name: normalizedName, current_value: value });
  }

  return results;
}

export default function SkillImportPage({ params }: Props) {
  const [characterId, setCharacterId] = useState("");
  const [characterName, setCharacterName] = useState("");
  const [inputText, setInputText] = useState("");
  const [parsed, setParsed] = useState<ParsedSkill[]>([]);
  const [existingSkills, setExistingSkills] = useState<CharacterSkill[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
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
        supabase.from("character_skills").select("*").eq("character_id", id),
      ]).then(([charRes, skillsRes]) => {
        if (charRes.data) setCharacterName(charRes.data.name);
        setExistingSkills(skillsRes.data ?? []);
        setLoading(false);
      });
    });
  }, [params]);

  function handleParse() {
    setParsed(parseSkillText(inputText));
    setSaved(false);
  }

  async function handleSave() {
    if (!isSupabaseConfigured || parsed.length === 0) return;
    setSaving(true);

    const existingMap = new Map<string, CharacterSkill>(
      existingSkills.map((s: CharacterSkill): [string, CharacterSkill] => [s.skill_name, s])
    );

    const toUpdate: { id: string; current_value: number }[] = [];
    const toInsert: { character_id: string; skill_name: string; base_value: number; current_value: number; is_occupation: boolean; growth_checked: boolean; is_favorite: boolean }[] = [];

    for (const p of parsed) {
      const existing = existingMap.get(p.normalized_name);
      if (existing) {
        toUpdate.push({ id: existing.id, current_value: p.current_value });
      } else {
        toInsert.push({
          character_id: characterId,
          skill_name: p.normalized_name,
          base_value: 0,
          current_value: p.current_value,
          is_occupation: false,
          growth_checked: false,
          is_favorite: false,
        });
      }
    }

    await Promise.all([
      ...toUpdate.map((u) =>
        supabase.from("character_skills").update({ current_value: u.current_value }).eq("id", u.id)
      ),
      toInsert.length > 0
        ? supabase.from("character_skills").insert(toInsert)
        : Promise.resolve(),
    ]);

    const { data: refreshed } = await supabase
      .from("character_skills")
      .select("*")
      .eq("character_id", characterId);
    setExistingSkills(refreshed ?? []);

    setSaving(false);
    setSaved(true);
    setParsed([]);
    setInputText("");
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-coc-muted text-sm">読み込み中...</p>
      </div>
    );
  }

  const existingMap = new Map<string, CharacterSkill>(
    existingSkills.map((s: CharacterSkill): [string, CharacterSkill] => [s.skill_name, s])
  );

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

      <h1 className="font-cinzel text-xl font-bold text-coc-text mb-2">技能値 一括インポート</h1>
      <p className="text-xs text-coc-muted mb-6">
        他ツールや紙シートからコピペした技能値を一括登録できます。
        既存の技能は値を更新し、新規は追加します。
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-coc-muted mb-1 uppercase tracking-widest">
            入力形式
          </label>
          <div className="rounded-lg border border-coc-border bg-coc-raised px-4 py-3 text-xs text-coc-muted space-y-1">
            <p>• <span className="text-coc-text font-mono">目星50 聞き耳40 図書館75</span>（スペース区切り）</p>
            <p>• <span className="text-coc-text font-mono">目星50、聞き耳40、図書館75</span>（カンマ区切り）</p>
            <p>• 1行1技能の改行区切りも可</p>
            <p>• 1〜100の範囲の数値のみ取り込みます</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-coc-muted mb-1 uppercase tracking-widest">
            技能値テキスト
          </label>
          <textarea
            value={inputText}
            onChange={(e) => { setInputText(e.target.value); setParsed([]); setSaved(false); }}
            rows={8}
            placeholder={"目星 50\n聞き耳 40\n図書館 75\n心理学 60"}
            className="w-full rounded-lg border border-coc-border bg-coc-surface px-3 py-2.5 text-sm text-coc-text placeholder-coc-muted/50 focus:outline-none focus:border-coc-gold/60 resize-y font-mono"
          />
        </div>

        <button
          onClick={handleParse}
          disabled={!inputText.trim()}
          className="rounded-lg border border-coc-border bg-coc-surface px-4 py-2 text-sm text-coc-text hover:border-coc-border-glow hover:text-coc-gold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          プレビュー
        </button>

        {saved && (
          <div className="rounded-lg border border-green-700/60 bg-green-950/20 px-4 py-3 text-sm text-green-300">
            登録が完了しました。
          </div>
        )}

        {parsed.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest">
              プレビュー（{parsed.length}件）
            </h2>
            <div className="rounded-lg border border-coc-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-coc-border bg-coc-raised">
                    <th className="px-3 py-2 text-left text-xs text-coc-muted font-semibold">技能名</th>
                    <th className="px-3 py-2 text-right text-xs text-coc-muted font-semibold w-20">値</th>
                    <th className="px-3 py-2 text-center text-xs text-coc-muted font-semibold w-20">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.map((p, i) => {
                    const existing = existingMap.get(p.normalized_name);
                    const isUpdate = !!existing;
                    return (
                      <tr key={i} className="border-b border-coc-border/50 last:border-0">
                        <td className="px-3 py-2 text-coc-text">
                          {p.normalized_name}
                          {p.raw_name !== p.normalized_name && (
                            <span className="ml-1 text-xs text-coc-muted">（入力: {p.raw_name}）</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-coc-text">
                          {isUpdate && (
                            <span className="text-xs text-coc-muted mr-1">
                              {existing.current_value} →
                            </span>
                          )}
                          {p.current_value}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`rounded px-1.5 py-0.5 text-xs font-semibold ${
                            isUpdate
                              ? "bg-blue-900/40 border border-blue-700/60 text-blue-300"
                              : "bg-green-900/40 border border-green-700/60 text-green-300"
                          }`}>
                            {isUpdate ? "更新" : "新規"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full rounded-lg border border-coc-gold/60 bg-coc-gold/10 px-4 py-2.5 text-sm font-semibold text-coc-gold hover:bg-coc-gold/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed motion-safe:active:scale-[0.98]"
            >
              {saving ? "登録中..." : `${parsed.length}件を一括登録`}
            </button>
          </div>
        )}

        {parsed.length === 0 && inputText.trim() && (
          <p className="text-xs text-coc-muted">
            「プレビュー」を押して確認してください。技能名が見つからない場合は、入力形式を確認してください。
          </p>
        )}
      </div>
    </div>
  );
}
