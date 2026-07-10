"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, StickyNote, X } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Character, CharacterSkill, CharacterCondition } from "@/lib/supabase";

const CONDITION_COLOR: Record<string, string> = {
  red: "border-red-700 bg-red-950/40 text-red-300",
  green: "border-green-700 bg-green-950/40 text-green-300",
  yellow: "border-yellow-700 bg-yellow-950/40 text-yellow-300",
  blue: "border-blue-700 bg-blue-950/40 text-blue-300",
  gray: "border-coc-border bg-coc-raised text-coc-muted",
};

const DEGREE_COLOR: Record<string, string> = {
  "決定的成功": "text-yellow-400",
  "通常成功": "text-green-400",
  "失敗": "text-coc-muted",
  "致命的失敗": "text-red-400",
};

const DEGREE_TO_LEVEL: Record<string, string> = {
  "決定的成功": "critical_success",
  "通常成功": "success",
  "失敗": "failure",
  "致命的失敗": "fumble",
};

type Toast = { id: number; text: string; degree: string };

function getBarColor(pct: number): string {
  if (pct > 50) return "#22c55e";
  if (pct > 25) return "#eab308";
  return "#ef4444";
}

function judge(roll: number, skillValue: number): string {
  const isFumble = skillValue < 50 ? roll >= 96 : roll === 100;
  if (isFumble) return "致命的失敗";
  if (roll <= Math.floor(skillValue / 5)) return "決定的成功";
  if (roll <= skillValue) return "通常成功";
  return "失敗";
}

function rollPercentile(): number {
  const ones = Math.floor(Math.random() * 10);
  const tens = Math.floor(Math.random() * 10);
  const value = tens * 10 + ones;
  return value === 0 ? 100 : value;
}

export default function FocusModePage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : "";

  const [char, setChar] = useState<Character | null>(null);
  const [skills, setSkills] = useState<CharacterSkill[]>([]);
  const [conditions, setConditions] = useState<CharacterCondition[]>([]);
  const [stats, setStats] = useState({ hp: 0, mp: 0, san: 0 });
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [memoOpen, setMemoOpen] = useState(false);
  const [memoText, setMemoText] = useState("");
  const [memoSaving, setMemoSaving] = useState(false);
  const [rolling, setRolling] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !isSupabaseConfigured) { setLoading(false); return; }
    setLoading(true);
    Promise.all([
      supabase.from("characters").select("*").eq("id", id).single(),
      supabase.from("character_skills").select("*").eq("character_id", id),
      supabase.from("character_conditions").select("*").eq("character_id", id).order("created_at", { ascending: true }),
    ]).then(([{ data: charData }, { data: skillsData }, { data: condData }]) => {
      if (charData) {
        setChar(charData as Character);
        setStats({ hp: charData.hp_current, mp: charData.mp_current, san: charData.san_current });
      }
      setSkills((skillsData ?? []) as CharacterSkill[]);
      setConditions((condData ?? []) as CharacterCondition[]);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (!id || !isSupabaseConfigured) return;
    const channel = supabase
      .channel(`focus-mode-character-${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "characters", filter: `id=eq.${id}` },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          const p = payload.new as { hp_current: number; mp_current: number; san_current: number };
          setStats({ hp: p.hp_current, mp: p.mp_current, san: p.san_current });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  const addToast = useCallback((text: string, degree: string) => {
    const tid = Date.now();
    setToasts((prev) => [...prev, { id: tid, text, degree }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== tid)), 3500);
  }, []);

  const rollSkill = useCallback(
    (skill: CharacterSkill) => {
      if (rolling) return;
      setRolling(skill.id);
      setTimeout(() => {
        const rolled = rollPercentile();
        const degree = judge(rolled, skill.current_value);
        addToast(`${skill.skill_name}（${skill.current_value}%）→ ${rolled} : ${degree}`, degree);
        setRolling(null);
        if (id && isSupabaseConfigured) {
          supabase.from("dice_rolls").insert({
            character_id: id,
            skill_name: skill.skill_name,
            skill_value: skill.current_value,
            roll_value: rolled,
            success_level: DEGREE_TO_LEVEL[degree],
            rolled_at: new Date().toISOString(),
          });
        }
      }, 300);
    },
    [rolling, id, addToast]
  );

  const saveMemo = useCallback(async () => {
    if (!memoText.trim() || !isSupabaseConfigured || !id) return;
    setMemoSaving(true);
    await supabase.from("quick_notes").insert({ character_id: id, content: memoText.trim() });
    setMemoSaving(false);
    setMemoText("");
    setMemoOpen(false);
  }, [memoText, id]);

  if (!isSupabaseConfigured || loading) {
    return (
      <div className="fixed inset-0 bg-coc-bg flex items-center justify-center">
        <span className="text-coc-muted text-sm animate-pulse">Loading…</span>
      </div>
    );
  }

  if (!char) {
    return (
      <div className="fixed inset-0 bg-coc-bg flex flex-col items-center justify-center gap-4">
        <p className="text-red-400 text-sm">キャラクターが見つかりません</p>
        <Link href="/characters" className="text-xs text-coc-muted underline">キャラクター一覧へ</Link>
      </div>
    );
  }

  const favoriteSkills = skills.filter((s) => s.is_favorite).slice(0, 10);
  const activeConditions = conditions.filter((c) => c.is_active);

  const statsConfig = [
    { key: "hp", label: "HP", current: stats.hp, max: char.hp_max },
    { key: "mp", label: "MP", current: stats.mp, max: char.mp_max },
    { key: "san", label: "SAN", current: stats.san, max: char.san_max },
  ];

  return (
    <>
      <style>{`html,body{overflow:hidden!important;}`}</style>

      <div className="fixed inset-0 bg-coc-bg flex flex-col overflow-hidden">
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-coc-border shrink-0 bg-coc-surface/80 backdrop-blur-sm">
          <Link
            href={`/characters/${id}`}
            className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
          >
            <ArrowLeft size={15} />
            戻る
          </Link>
          <h1 className="font-cinzel text-sm font-bold text-coc-text truncate max-w-[60%]">{char.name}</h1>
          <div className="w-12" />
        </div>

        {/* スクロール可能なメインコンテンツ */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 pb-24 space-y-4">

          {/* HP / MP / SAN バー */}
          <div className="rounded-xl border border-coc-border bg-coc-surface p-4 space-y-4">
            {statsConfig.map(({ key, label, current, max }) => {
              const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
              return (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-bold tracking-widest text-coc-muted uppercase">{label}</span>
                    <span className="font-bold tabular-nums text-2xl leading-none" style={{ color: getBarColor(pct) }}>
                      {current}
                      <span className="text-sm font-normal text-coc-muted ml-0.5">/{max}</span>
                    </span>
                  </div>
                  <div className="h-4 rounded-full bg-coc-raised overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: getBarColor(pct) }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* アクティブコンディション */}
          {activeConditions.length > 0 && (
            <div className="rounded-xl border border-coc-border bg-coc-surface p-4">
              <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest mb-3">状態異常</h2>
              <div className="flex flex-wrap gap-2">
                {activeConditions.map((c) => (
                  <span
                    key={c.id}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${CONDITION_COLOR[c.color ?? "gray"] ?? CONDITION_COLOR.gray}`}
                  >
                    {c.condition_name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* お気に入り技能 × ダイスロール */}
          {favoriteSkills.length > 0 ? (
            <div className="rounded-xl border border-yellow-400/30 bg-coc-surface p-4">
              <h2 className="text-xs font-semibold text-yellow-400 uppercase tracking-widest mb-3">★ 技能判定（タップでロール）</h2>
              <div className="grid grid-cols-2 gap-2">
                {favoriteSkills.map((skill) => (
                  <button
                    key={skill.id}
                    onClick={() => rollSkill(skill)}
                    disabled={rolling !== null}
                    className="flex flex-col items-start rounded-lg border border-coc-border bg-coc-raised px-3 py-2.5 text-left transition-all hover:border-yellow-400/50 hover:bg-coc-surface active:scale-[0.97] disabled:opacity-60"
                  >
                    <span className="text-xs font-semibold text-coc-text leading-tight truncate w-full">{skill.skill_name}</span>
                    <span className="text-xl font-bold text-yellow-400 tabular-nums leading-snug">
                      {rolling === skill.id ? "…" : `${skill.current_value}%`}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-coc-border bg-coc-surface p-4 text-center">
              <p className="text-xs text-coc-muted">お気に入り技能がありません。</p>
              <Link href={`/characters/${id}`} className="text-xs text-coc-gold underline mt-1 inline-block">
                技能にお気に入りを設定する
              </Link>
            </div>
          )}
        </div>

        {/* フローティングメモボタン */}
        <button
          onClick={() => setMemoOpen(true)}
          className="fixed bottom-6 right-5 rounded-full bg-coc-gold text-black p-3.5 shadow-xl hover:brightness-110 transition-all active:scale-95 z-40"
          aria-label="クイックメモを追加"
        >
          <StickyNote size={20} />
        </button>

        {/* トースト通知（上部中央） */}
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center pointer-events-none w-[90vw] max-w-sm">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`w-full rounded-lg border border-coc-border bg-coc-surface/95 backdrop-blur-sm px-4 py-2.5 text-sm font-semibold shadow-lg ${DEGREE_COLOR[t.degree] ?? "text-coc-text"}`}
            >
              {t.text}
            </div>
          ))}
        </div>
      </div>

      {/* クイックメモモーダル */}
      {memoOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setMemoOpen(false); }}
        >
          <div className="w-full sm:max-w-md bg-coc-surface border border-coc-border rounded-t-2xl sm:rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="font-cinzel text-sm font-semibold text-coc-gold">クイックメモ</h2>
              <button onClick={() => setMemoOpen(false)} className="text-coc-muted hover:text-coc-text transition-colors">
                <X size={18} />
              </button>
            </div>
            <textarea
              rows={4}
              value={memoText}
              onChange={(e) => setMemoText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) saveMemo(); }}
              placeholder="走り書きメモ（重要情報、KPの発言…）"
              className="w-full rounded-md border border-coc-border bg-coc-void px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:outline-none focus:border-coc-gold resize-none"
              autoFocus
            />
            <p className="text-xs text-coc-muted">Ctrl+Enterで保存</p>
            <div className="flex gap-2">
              <button
                onClick={() => setMemoOpen(false)}
                className="flex-1 rounded-lg border border-coc-border px-4 py-2 text-sm text-coc-muted hover:text-coc-text transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={saveMemo}
                disabled={memoSaving || !memoText.trim()}
                className="flex-1 rounded-lg bg-coc-gold text-black font-semibold text-sm py-2 disabled:opacity-40 hover:brightness-110 transition-all"
              >
                {memoSaving ? "保存中…" : "保存"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
