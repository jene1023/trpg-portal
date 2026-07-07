"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase, isSupabaseConfigured, CharacterCondition } from "@/lib/supabase";

const COLOR_OPTIONS = [
  { value: "red", label: "赤（負傷・出血）", badge: "border-red-700 bg-red-950/40 text-red-300", button: "bg-red-900/30 border-red-700 text-red-300" },
  { value: "yellow", label: "黄（拘束・疲弊）", badge: "border-yellow-700 bg-yellow-950/40 text-yellow-300", button: "bg-yellow-900/30 border-yellow-700 text-yellow-300" },
  { value: "green", label: "緑（毒）", badge: "border-green-700 bg-green-950/40 text-green-300", button: "bg-green-900/30 border-green-700 text-green-300" },
  { value: "blue", label: "青（硬直・冷静）", badge: "border-blue-700 bg-blue-950/40 text-blue-300", button: "bg-blue-900/30 border-blue-700 text-blue-300" },
  { value: "gray", label: "グレー（その他）", badge: "border-coc-border bg-coc-raised text-coc-muted", button: "border-coc-border bg-coc-raised text-coc-muted" },
];

function colorBadgeClass(color: string | null) {
  return COLOR_OPTIONS.find((c) => c.value === (color ?? "gray"))?.badge ?? COLOR_OPTIONS[4].badge;
}

const PRESET_CONDITIONS = [
  { name: "負傷", color: "red" },
  { name: "毒", color: "green" },
  { name: "拘束", color: "yellow" },
  { name: "盲目", color: "gray" },
  { name: "硬直", color: "blue" },
  { name: "出血", color: "red" },
  { name: "疲弊", color: "yellow" },
];

export default function ConditionsPage() {
  const params = useParams();
  const id = params.id as string;

  const [conditions, setConditions] = useState<CharacterCondition[]>([]);
  const [characterName, setCharacterName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 追加フォーム
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("red");
  const [newNotes, setNewNotes] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    const fetchData = async () => {
      const [{ data: char }, { data: conds }] = await Promise.all([
        supabase.from("characters").select("name").eq("id", id).single(),
        supabase.from("character_conditions").select("*").eq("character_id", id).order("is_active", { ascending: false }),
      ]);
      if (char) setCharacterName(char.name);
      setConditions(conds ?? []);
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const toggle = useCallback(async (condition: CharacterCondition) => {
    if (!isSupabaseConfigured) return;
    setSaving(true);
    const { data } = await supabase
      .from("character_conditions")
      .update({ is_active: !condition.is_active })
      .eq("id", condition.id)
      .select()
      .single();
    if (data) setConditions((prev) => prev.map((c) => (c.id === data.id ? data : c)).sort((a, b) => Number(b.is_active) - Number(a.is_active)));
    setSaving(false);
  }, []);

  const remove = useCallback(async (conditionId: string) => {
    if (!isSupabaseConfigured) return;
    setSaving(true);
    await supabase.from("character_conditions").delete().eq("id", conditionId);
    setConditions((prev) => prev.filter((c) => c.id !== conditionId));
    setSaving(false);
  }, []);

  const addCondition = useCallback(async () => {
    const name = newName.trim();
    if (!name || !isSupabaseConfigured) return;
    setSaving(true);
    const { data } = await supabase
      .from("character_conditions")
      .insert({ character_id: id, condition_name: name, color: newColor, is_active: true, notes: newNotes.trim() || null })
      .select()
      .single();
    if (data) setConditions((prev) => [data, ...prev]);
    setNewName("");
    setNewNotes("");
    setNewColor("red");
    setSaving(false);
  }, [id, newName, newColor, newNotes]);

  const addPreset = useCallback(async (name: string, color: string) => {
    if (!isSupabaseConfigured) return;
    const existing = conditions.find((c) => c.condition_name === name);
    if (existing) {
      if (!existing.is_active) await toggle(existing);
      return;
    }
    setSaving(true);
    const { data } = await supabase
      .from("character_conditions")
      .insert({ character_id: id, condition_name: name, color, is_active: true })
      .select()
      .single();
    if (data) setConditions((prev) => [data, ...prev]);
    setSaving(false);
  }, [id, conditions, toggle]);

  const activeConditions = conditions.filter((c) => c.is_active);
  const inactiveConditions = conditions.filter((c) => !c.is_active);

  if (loading) {
    return <div className="mx-auto max-w-2xl px-4 py-8 text-coc-muted">読み込み中...</div>;
  }

  return (
    <div className="coc-page-enter mx-auto max-w-2xl px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/characters/${id}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          {characterName || "キャラクター詳細"}へ
        </Link>
      </div>

      <div>
        <h1 className="font-cinzel text-2xl font-bold text-coc-text coc-name-glow">コンディション管理</h1>
        {characterName && <p className="text-sm text-coc-muted mt-1">{characterName}</p>}
      </div>

      {/* アクティブ状態異常 */}
      <section className="rounded-lg border border-coc-border coc-card-bg p-4 space-y-3">
        <h2 className="coc-section-title font-cinzel text-sm font-semibold text-coc-muted uppercase tracking-widest">
          アクティブな状態異常
          {activeConditions.length > 0 && (
            <span className="ml-2 rounded bg-red-900/40 border border-red-700/60 px-1.5 py-0.5 text-xs text-red-300 normal-case font-normal">
              {activeConditions.length}件
            </span>
          )}
        </h2>

        {activeConditions.length === 0 ? (
          <p className="text-sm text-coc-muted">現在の状態異常なし</p>
        ) : (
          <div className="space-y-2">
            {activeConditions.map((c) => (
              <div
                key={c.id}
                className={`flex items-start justify-between rounded-lg border px-3 py-2.5 ${colorBadgeClass(c.color)}`}
              >
                <div className="space-y-0.5 flex-1 min-w-0">
                  <p className="font-semibold text-sm">{c.condition_name}</p>
                  {c.notes && <p className="text-xs opacity-75 break-words">{c.notes}</p>}
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  <button
                    onClick={() => toggle(c)}
                    disabled={saving}
                    className="rounded border border-current/40 bg-current/10 px-2 py-1 text-xs opacity-80 hover:opacity-100 transition-opacity disabled:opacity-40"
                  >
                    回復
                  </button>
                  <button
                    onClick={() => remove(c.id)}
                    disabled={saving}
                    className="rounded border border-current/40 bg-current/10 px-2 py-1 text-xs opacity-60 hover:opacity-90 transition-opacity disabled:opacity-40"
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* プリセットから追加 */}
      <section className="rounded-lg border border-coc-border coc-card-bg p-4 space-y-3">
        <h2 className="coc-section-title font-cinzel text-sm font-semibold text-coc-muted uppercase tracking-widest">プリセットから追加</h2>
        <div className="flex flex-wrap gap-2">
          {PRESET_CONDITIONS.map((p) => {
            const active = conditions.find((c) => c.condition_name === p.name && c.is_active);
            return (
              <button
                key={p.name}
                onClick={() => addPreset(p.name, p.color)}
                disabled={saving}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors disabled:opacity-50 ${
                  active
                    ? `${colorBadgeClass(p.color)} ring-1 ring-inset`
                    : "border-coc-border bg-coc-raised text-coc-muted hover:border-coc-border-glow hover:text-coc-text"
                }`}
              >
                {active ? "✓ " : "+ "}{p.name}
              </button>
            );
          })}
        </div>
      </section>

      {/* カスタム追加フォーム */}
      <section className="rounded-lg border border-coc-border coc-card-bg p-4 space-y-3">
        <h2 className="coc-section-title font-cinzel text-sm font-semibold text-coc-muted uppercase tracking-widest">カスタムコンディションを追加</h2>
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addCondition(); }}
              placeholder="状態異常の名前..."
              className="flex-1 rounded border border-coc-border bg-coc-void px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:outline-none focus:border-coc-border-glow"
            />
            <select
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="rounded border border-coc-border bg-coc-void px-2 py-2 text-sm text-coc-text focus:outline-none focus:border-coc-border-glow"
            >
              {COLOR_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <textarea
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
            placeholder="メモ（任意）..."
            rows={2}
            className="w-full rounded border border-coc-border bg-coc-void px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:outline-none focus:border-coc-border-glow resize-none"
          />
          <button
            onClick={addCondition}
            disabled={saving || !newName.trim()}
            className="rounded-lg border border-coc-gold/50 bg-coc-gold/10 px-4 py-2 text-sm text-coc-gold hover:bg-coc-gold/20 hover:border-coc-gold/70 transition-colors disabled:opacity-50"
          >
            追加
          </button>
        </div>
      </section>

      {/* 解除済み状態異常 */}
      {inactiveConditions.length > 0 && (
        <section className="rounded-lg border border-coc-border coc-card-bg p-4 space-y-3">
          <h2 className="coc-section-title font-cinzel text-sm font-semibold text-coc-muted uppercase tracking-widest">解除済み</h2>
          <div className="space-y-2">
            {inactiveConditions.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-lg border border-coc-border bg-coc-raised/30 px-3 py-2.5 opacity-50"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-coc-muted line-through">{c.condition_name}</p>
                  {c.notes && <p className="text-xs text-coc-muted mt-0.5 break-words">{c.notes}</p>}
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  <button
                    onClick={() => toggle(c)}
                    disabled={saving}
                    className="rounded border border-coc-border px-2 py-1 text-xs text-coc-muted hover:text-coc-text hover:border-coc-border-glow transition-colors disabled:opacity-40"
                  >
                    再発動
                  </button>
                  <button
                    onClick={() => remove(c.id)}
                    disabled={saving}
                    className="rounded border border-coc-border px-2 py-1 text-xs text-coc-muted hover:text-coc-text transition-colors disabled:opacity-40"
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
