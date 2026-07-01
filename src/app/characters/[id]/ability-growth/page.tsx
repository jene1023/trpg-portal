"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase, isSupabaseConfigured, CharacterAbilityGrowth } from "@/lib/supabase";

type Props = { params: Promise<{ id: string }> };

type AbilityKey = "edu" | "pow" | "str" | "con" | "dex" | "app" | "siz" | "int_stat";

const ABILITY_OPTIONS: { key: AbilityKey; label: string }[] = [
  { key: "edu", label: "EDU（教育）" },
  { key: "pow", label: "POW（意志力）" },
  { key: "str", label: "STR（筋力）" },
  { key: "con", label: "CON（体力）" },
  { key: "dex", label: "DEX（敏捷性）" },
  { key: "app", label: "APP（外見）" },
  { key: "siz", label: "SIZ（体格）" },
  { key: "int_stat", label: "INT（知性）" },
];

type Character = {
  id: string;
  name: string;
  edu: number;
  pow: number;
  str: number;
  con: number;
  dex: number;
  app: number;
  siz: number;
  int_stat: number;
};

type RollResult = {
  ability: AbilityKey;
  abilityLabel: string;
  rolled: number;
  success: boolean;
  gain: number | null;
  oldValue: number;
  newValue: number;
};

export default function AbilityGrowthPage({ params }: Props) {
  const [characterId, setCharacterId] = useState<string>("");
  const [character, setCharacter] = useState<Character | null>(null);
  const [selectedAbility, setSelectedAbility] = useState<AbilityKey>("edu");
  const [results, setResults] = useState<RollResult[]>([]);
  const [history, setHistory] = useState<CharacterAbilityGrowth[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(({ id }) => {
      setCharacterId(id);
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }
      Promise.all([
        supabase
          .from("characters")
          .select("id, name, edu, pow, str, con, dex, app, siz, int_stat")
          .eq("id", id)
          .single(),
        supabase
          .from("character_ability_growths")
          .select("*")
          .eq("character_id", id)
          .order("created_at", { ascending: false })
          .limit(20),
      ]).then(([charRes, histRes]) => {
        if (charRes.data) setCharacter(charRes.data as Character);
        setHistory(histRes.data ?? []);
        setLoading(false);
      });
    });
  }, [params]);

  async function rollGrowth() {
    if (!character) return;

    const currentValue = character[selectedAbility];
    const option = ABILITY_OPTIONS.find((o) => o.key === selectedAbility)!;
    const rolled = Math.floor(Math.random() * 100) + 1;
    const success = rolled > currentValue;
    const gain = success ? Math.floor(Math.random() * 10) + 1 : null;
    const newValue = success ? currentValue + gain! : currentValue;

    const result: RollResult = {
      ability: selectedAbility,
      abilityLabel: option.label,
      rolled,
      success,
      gain,
      oldValue: currentValue,
      newValue,
    };

    setResults((prev) => [result, ...prev]);

    if (!isSupabaseConfigured || !success) return;

    const updatePayload: Partial<Record<AbilityKey, number>> = {
      [selectedAbility]: newValue,
    };
    await supabase.from("characters").update(updatePayload).eq("id", characterId);

    const growthRecord = {
      character_id: characterId,
      ability_name: option.label,
      old_value: currentValue,
      new_value: newValue,
      grown_at: new Date().toISOString(),
    };
    await supabase.from("character_ability_growths").insert(growthRecord);

    setCharacter((prev) =>
      prev ? { ...prev, [selectedAbility]: newValue } : prev
    );
    setHistory((prev) => [
      {
        id: crypto.randomUUID(),
        character_id: characterId,
        ability_name: option.label,
        old_value: currentValue,
        new_value: newValue,
        grown_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);
  }

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
          {character?.name || "キャラクター詳細"}
        </Link>
      </div>

      <h1 className="font-cinzel text-xl font-bold text-coc-text mb-2">能力値成長チェック</h1>
      <p className="text-xs text-coc-muted mb-6">
        CoC7版ルール: 1d100 を振り現在値を超えれば 1d10 を加算します。主にEDUが対象ですが、任意の能力値にも適用できます。
      </p>

      {/* 能力値選択・ロールフォーム */}
      <div className="rounded-lg border border-coc-border coc-card-bg p-5 mb-6 space-y-4">
        <div>
          <label className="block text-xs text-coc-muted mb-1.5">成長チェックする能力値</label>
          <select
            value={selectedAbility}
            onChange={(e) => setSelectedAbility(e.target.value as AbilityKey)}
            className="w-full rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text focus:outline-none focus:border-coc-gold/60"
          >
            {ABILITY_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
                {character ? ` (現在値: ${character[opt.key]})` : ""}
              </option>
            ))}
          </select>
        </div>

        {character && (
          <div className="flex items-center justify-between rounded-md bg-coc-raised border border-coc-border px-4 py-3">
            <div>
              <p className="text-xs text-coc-muted">
                {ABILITY_OPTIONS.find((o) => o.key === selectedAbility)?.label}
              </p>
              <p className="text-2xl font-bold text-coc-text tabular-nums">
                {character[selectedAbility]}
              </p>
            </div>
            <p className="text-xs text-coc-muted">
              1d100 &gt; {character[selectedAbility]} で成功
            </p>
          </div>
        )}

        <button
          onClick={rollGrowth}
          disabled={!character}
          className="w-full rounded-lg border border-coc-gold/60 bg-coc-gold/10 px-4 py-2.5 text-sm font-semibold text-coc-gold hover:bg-coc-gold/20 transition-colors motion-safe:active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          成長チェックを実行
        </button>
      </div>

      {/* 今回の判定結果 */}
      {results.length > 0 && (
        <div className="mb-6 space-y-3">
          <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest">
            今回の判定結果
          </h2>
          {results.map((r, i) => (
            <div
              key={i}
              className={`rounded-lg border px-4 py-3 ${
                r.success
                  ? "border-green-700/60 bg-green-950/20"
                  : "border-coc-border bg-coc-surface/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-coc-text">{r.abilityLabel}</p>
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
          ))}
        </div>
      )}

      {/* 成長履歴 */}
      <div>
        <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest mb-3">
          成長履歴（最新20件）
        </h2>
        {history.length === 0 ? (
          <div className="rounded-lg border border-coc-border coc-card-bg p-6 text-center">
            <p className="text-coc-muted text-sm">まだ能力値成長の記録がありません。</p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between rounded-lg border border-coc-border bg-coc-surface px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-coc-text">{h.ability_name}</p>
                  <p className="text-xs text-coc-muted">
                    {h.grown_at
                      ? new Date(h.grown_at).toLocaleDateString("ja-JP")
                      : new Date(h.created_at).toLocaleDateString("ja-JP")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono text-coc-muted">
                    {h.old_value}{" "}
                    <span className="text-coc-gold">→</span>{" "}
                    <span className="text-green-300 font-semibold">{h.new_value}</span>
                  </p>
                  <p className="text-xs text-green-400">
                    +{h.new_value - h.old_value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
