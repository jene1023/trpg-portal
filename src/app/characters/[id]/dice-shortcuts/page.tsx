"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Dice6, Trash2, Plus } from "lucide-react";
import { supabase, isSupabaseConfigured, DiceShortcut } from "@/lib/supabase";
import { evaluateDiceExpression } from "@/lib/diceExpression";

type Props = { params: Promise<{ id: string }> };

type RollResult = {
  shortcutId: string;
  label: string;
  expression: string;
  total: number;
  detail: string;
};

export default function DiceShortcutsPage({ params }: Props) {
  const [characterId, setCharacterId] = useState<string>("");
  const [shortcuts, setShortcuts] = useState<DiceShortcut[]>([]);
  const [label, setLabel] = useState("");
  const [expression, setExpression] = useState("");
  const [saving, setSaving] = useState(false);
  const [rolling, setRolling] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<RollResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then(({ id }) => {
      setCharacterId(id);
      if (!isSupabaseConfigured) return;
      supabase
        .from("dice_shortcuts")
        .select("*")
        .eq("character_id", id)
        .order("created_at", { ascending: true })
        .then(({ data }) => {
          if (data) setShortcuts(data);
        });
    });
  }, [params]);

  async function addShortcut(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim() || !expression.trim()) return;
    if (!isSupabaseConfigured) return;

    // validate expression
    try {
      evaluateDiceExpression(expression.trim());
    } catch {
      setError("無効なダイス式です（例: 2d6, 1d4+1d6+2）");
      return;
    }

    setSaving(true);
    setError(null);
    const { data, error: dbErr } = await supabase
      .from("dice_shortcuts")
      .insert({
        character_id: characterId,
        label: label.trim(),
        expression: expression.trim(),
      })
      .select()
      .single();

    setSaving(false);
    if (dbErr) {
      setError("保存に失敗しました");
      return;
    }
    if (data) {
      setShortcuts((prev) => [...prev, data]);
      setLabel("");
      setExpression("");
    }
  }

  async function deleteShortcut(id: string) {
    if (!isSupabaseConfigured) return;
    await supabase.from("dice_shortcuts").delete().eq("id", id);
    setShortcuts((prev) => prev.filter((s) => s.id !== id));
    if (lastResult?.shortcutId === id) setLastResult(null);
  }

  function roll(shortcut: DiceShortcut) {
    if (rolling) return;
    setRolling(shortcut.id);
    setLastResult(null);
    setTimeout(() => {
      const evaluated = evaluateDiceExpression(shortcut.expression);
      setLastResult({
        shortcutId: shortcut.id,
        label: shortcut.label,
        expression: shortcut.expression,
        total: evaluated.total,
        detail: evaluated.detail,
      });
      setRolling(null);

      if (isSupabaseConfigured && characterId) {
        supabase.from("dice_rolls").insert({
          character_id: characterId,
          skill_name: `ショートカット: ${shortcut.label}`,
          skill_value: 0,
          roll_value: evaluated.total,
          success_level: "success",
          rolled_at: new Date().toISOString(),
        });
      }
    }, 300);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={characterId ? `/characters/${characterId}` : "/characters"}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          キャラクターへ
        </Link>
      </div>

      <div>
        <h1 className="font-cinzel text-xl font-bold text-coc-text">カスタムダイス式ショートカット</h1>
        <p className="text-sm text-coc-muted mt-1">よく使うダイス式を登録してワンタップでロールできます</p>
      </div>

      {/* 追加フォーム */}
      <form
        onSubmit={addShortcut}
        className="rounded-lg border border-coc-border coc-card-bg p-4 space-y-3"
      >
        <h2 className="text-sm font-semibold text-coc-muted uppercase tracking-widest">新しいショートカットを追加</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-coc-muted block mb-1">ラベル名</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="例: ダメージ確認"
              className="w-full rounded-md border border-coc-border bg-coc-raised text-coc-text text-sm px-3 py-1.5 focus:outline-none focus:border-coc-gold"
              maxLength={30}
            />
          </div>
          <div>
            <label className="text-xs text-coc-muted block mb-1">ダイス式</label>
            <input
              type="text"
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              placeholder="例: 2d6, 1d4+1d6+2"
              className="w-full rounded-md border border-coc-border bg-coc-raised text-coc-text text-sm px-3 py-1.5 focus:outline-none focus:border-coc-gold"
            />
          </div>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={saving || !label.trim() || !expression.trim()}
          className="flex items-center gap-1.5 rounded-md border border-coc-gold text-coc-gold px-4 py-1.5 text-sm font-medium hover:bg-coc-gold/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus size={14} />
          追加
        </button>
      </form>

      {/* ショートカット一覧 */}
      {shortcuts.length === 0 ? (
        <p className="text-sm text-coc-muted text-center py-8">
          ショートカットがありません。上のフォームから追加してください。
        </p>
      ) : (
        <div className="space-y-2">
          {shortcuts.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-3 rounded-lg border border-coc-border coc-card-bg px-4 py-3"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-coc-text">{s.label}</p>
                <p className="text-xs text-coc-muted font-mono">{s.expression}</p>
              </div>
              <button
                onClick={() => roll(s)}
                disabled={!!rolling}
                className="flex items-center gap-1.5 rounded-md border border-coc-gold text-coc-gold px-3 py-1.5 text-xs font-medium hover:bg-coc-gold/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Dice6 size={13} className={rolling === s.id ? "animate-spin" : ""} />
                ロール
              </button>
              <button
                onClick={() => deleteShortcut(s.id)}
                className="text-coc-muted hover:text-red-400 transition-colors p-1"
                aria-label="削除"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ロール結果 */}
      {lastResult && (
        <div className="rounded-lg border border-coc-border bg-coc-raised px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-coc-muted mb-0.5">
              {lastResult.label}（{lastResult.expression}）
            </p>
            <p className="text-sm text-coc-muted">{lastResult.detail}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-coc-muted mb-0.5">合計</p>
            <p className="font-cinzel text-3xl font-bold text-coc-text">{lastResult.total}</p>
          </div>
        </div>
      )}

      <div className="rounded-md border border-coc-border bg-coc-raised p-3 text-xs text-coc-muted space-y-1">
        <p className="font-semibold text-coc-text">ダイス式の書き方</p>
        <p>• <span className="font-mono">2d6</span> — 6面ダイスを2個</p>
        <p>• <span className="font-mono">1d4+1d6</span> — 4面+6面の合計</p>
        <p>• <span className="font-mono">1d6+2</span> — 6面ダイス＋修正値</p>
        <p>• <span className="font-mono">1d100</span> — 100面ダイス（パーセンタイル）</p>
      </div>
    </div>
  );
}
