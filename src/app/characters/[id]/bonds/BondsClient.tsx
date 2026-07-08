"use client";

import { useState } from "react";
import { supabase, isSupabaseConfigured, CharacterBond } from "@/lib/supabase";

type Props = {
  characterId: string;
  initialBonds: CharacterBond[];
};

export default function BondsClient({ characterId, initialBonds }: Props) {
  const [bonds, setBonds] = useState<CharacterBond[]>(initialBonds);
  const [targetName, setTargetName] = useState("");
  const [bondScore, setBondScore] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const activeBonds = bonds.filter((b) => !b.is_lost);
  const lostBonds = bonds.filter((b) => b.is_lost);

  async function addBond() {
    const score = parseInt(bondScore, 10);
    if (!targetName.trim() || isNaN(score) || score < 0) return;
    if (!isSupabaseConfigured) return;
    setSaving(true);
    setError("");
    const { data, error: err } = await supabase
      .from("character_bonds")
      .insert({
        character_id: characterId,
        target_name: targetName.trim(),
        bond_score: score,
        damage_taken: 0,
        is_lost: false,
        notes: notes.trim() || null,
      })
      .select()
      .single();
    setSaving(false);
    if (err || !data) {
      setError("追加に失敗しました");
      return;
    }
    setBonds((prev) => [...prev, data as CharacterBond]);
    setTargetName("");
    setBondScore("");
    setNotes("");
  }

  async function adjustScore(bondId: string, delta: number) {
    if (!isSupabaseConfigured) return;
    const bond = bonds.find((b) => b.id === bondId);
    if (!bond) return;
    const newScore = Math.max(0, bond.bond_score + delta);
    const { data, error: err } = await supabase
      .from("character_bonds")
      .update({ bond_score: newScore })
      .eq("id", bondId)
      .select()
      .single();
    if (err || !data) return;
    setBonds((prev) => prev.map((b) => (b.id === bondId ? (data as CharacterBond) : b)));
  }

  async function adjustDamage(bondId: string, delta: number) {
    if (!isSupabaseConfigured) return;
    const bond = bonds.find((b) => b.id === bondId);
    if (!bond) return;
    const newDamage = Math.max(0, bond.damage_taken + delta);
    const { data, error: err } = await supabase
      .from("character_bonds")
      .update({ damage_taken: newDamage })
      .eq("id", bondId)
      .select()
      .single();
    if (err || !data) return;
    setBonds((prev) => prev.map((b) => (b.id === bondId ? (data as CharacterBond) : b)));
  }

  async function markLost(bondId: string) {
    if (!isSupabaseConfigured) return;
    const { data, error: err } = await supabase
      .from("character_bonds")
      .update({ is_lost: true })
      .eq("id", bondId)
      .select()
      .single();
    if (err || !data) return;
    setBonds((prev) => prev.map((b) => (b.id === bondId ? (data as CharacterBond) : b)));
  }

  async function restoreBond(bondId: string) {
    if (!isSupabaseConfigured) return;
    const { data, error: err } = await supabase
      .from("character_bonds")
      .update({ is_lost: false })
      .eq("id", bondId)
      .select()
      .single();
    if (err || !data) return;
    setBonds((prev) => prev.map((b) => (b.id === bondId ? (data as CharacterBond) : b)));
  }

  async function deleteBond(bondId: string) {
    if (!isSupabaseConfigured) return;
    await supabase.from("character_bonds").delete().eq("id", bondId);
    setBonds((prev) => prev.filter((b) => b.id !== bondId));
  }

  return (
    <div className="space-y-6">
      {/* 追加フォーム */}
      <div className="rounded-lg border border-coc-border coc-card-bg p-4 space-y-3">
        <h2 className="text-sm font-semibold text-coc-muted uppercase tracking-widest">絆を追加</h2>
        <input
          type="text"
          placeholder="絆の対象（例: 山田花子）"
          value={targetName}
          onChange={(e) => setTargetName(e.target.value)}
          className="w-full rounded border border-coc-border bg-coc-void px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted/50 focus:outline-none focus:border-coc-gold/60"
        />
        <input
          type="number"
          placeholder="絆スコア（例: 3）"
          value={bondScore}
          onChange={(e) => setBondScore(e.target.value)}
          min={0}
          className="w-full rounded border border-coc-border bg-coc-void px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted/50 focus:outline-none focus:border-coc-gold/60"
        />
        <textarea
          placeholder="メモ（任意）"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full rounded border border-coc-border bg-coc-void px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted/50 focus:outline-none focus:border-coc-gold/60 resize-none"
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button
          onClick={addBond}
          disabled={saving || !targetName.trim() || !bondScore}
          className="rounded bg-coc-gold/20 border border-coc-gold/50 px-4 py-1.5 text-sm text-coc-gold hover:bg-coc-gold/30 transition-colors disabled:opacity-50"
        >
          {saving ? "追加中..." : "追加"}
        </button>
      </div>

      {/* アクティブな絆 */}
      {activeBonds.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-coc-muted uppercase tracking-widest">
            絆リスト ({activeBonds.length}件)
          </h2>
          {activeBonds.map((bond) => (
            <BondCard
              key={bond.id}
              bond={bond}
              onAdjustScore={adjustScore}
              onAdjustDamage={adjustDamage}
              onMarkLost={markLost}
              onRestore={restoreBond}
              onDelete={deleteBond}
            />
          ))}
        </div>
      )}

      {activeBonds.length === 0 && lostBonds.length === 0 && (
        <p className="text-center text-sm text-coc-muted py-8">
          絆が登録されていません
        </p>
      )}

      {/* 喪失した絆 */}
      {lostBonds.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-coc-muted uppercase tracking-widest">
            喪失した絆
          </h2>
          {lostBonds.map((bond) => (
            <BondCard
              key={bond.id}
              bond={bond}
              onAdjustScore={adjustScore}
              onAdjustDamage={adjustDamage}
              onMarkLost={markLost}
              onRestore={restoreBond}
              onDelete={deleteBond}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BondCard({
  bond,
  onAdjustScore,
  onAdjustDamage,
  onMarkLost,
  onRestore,
  onDelete,
}: {
  bond: CharacterBond;
  onAdjustScore: (id: string, delta: number) => Promise<void>;
  onAdjustDamage: (id: string, delta: number) => Promise<void>;
  onMarkLost: (id: string) => Promise<void>;
  onRestore: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const effective = Math.max(0, bond.bond_score - bond.damage_taken);

  return (
    <div
      className={`rounded-lg border p-4 space-y-3 ${
        bond.is_lost
          ? "border-coc-border/40 bg-coc-void/40 opacity-70"
          : effective === 0 && bond.bond_score > 0
          ? "border-red-800/60 bg-red-950/10"
          : "border-coc-border bg-coc-surface"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm leading-snug ${bond.is_lost ? "line-through text-coc-muted" : "text-coc-text"}`}>
            {bond.target_name}
          </p>
          {bond.notes && (
            <p className="text-xs text-coc-muted mt-0.5 leading-relaxed">
              {bond.notes}
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p
            className={`text-3xl font-bold tabular-nums leading-none ${
              bond.is_lost
                ? "text-coc-muted line-through"
                : effective === 0 && bond.bond_score > 0
                ? "text-red-400"
                : "text-coc-gold"
            }`}
          >
            {effective}
          </p>
          {bond.damage_taken > 0 && (
            <p className="text-xs text-coc-muted mt-0.5">
              {bond.bond_score}
              <span className="inline-flex items-center mx-1 rounded bg-red-900/60 border border-red-700/60 px-1 text-red-300 font-semibold">
                −{bond.damage_taken}
              </span>
            </p>
          )}
        </div>
      </div>

      {!bond.is_lost && (
        <div className="space-y-2">
          {/* 絆スコア +/- */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-coc-muted w-20 shrink-0">絆スコア</span>
            <button
              onClick={() => onAdjustScore(bond.id, -1)}
              disabled={bond.bond_score <= 0}
              className="rounded border border-coc-border px-2 py-0.5 text-xs text-coc-muted hover:text-coc-text hover:border-coc-border-glow transition-colors disabled:opacity-40"
            >
              −
            </button>
            <span className="text-sm font-bold text-coc-text tabular-nums w-8 text-center">{bond.bond_score}</span>
            <button
              onClick={() => onAdjustScore(bond.id, 1)}
              className="rounded border border-coc-border px-2 py-0.5 text-xs text-coc-muted hover:text-coc-text hover:border-coc-border-glow transition-colors"
            >
              ＋
            </button>
          </div>
          {/* ダメージ +/- */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-coc-muted w-20 shrink-0">ダメージ</span>
            <button
              onClick={() => onAdjustDamage(bond.id, -1)}
              disabled={bond.damage_taken === 0}
              className="rounded border border-green-700/60 px-2 py-0.5 text-xs text-green-400 hover:bg-green-950/30 transition-colors disabled:opacity-40"
            >
              −
            </button>
            <span className="text-sm font-bold text-red-400 tabular-nums w-8 text-center">{bond.damage_taken}</span>
            <button
              onClick={() => onAdjustDamage(bond.id, 1)}
              className="rounded border border-red-800/60 px-2 py-0.5 text-xs text-red-400 hover:bg-red-950/30 transition-colors"
            >
              ＋
            </button>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => onMarkLost(bond.id)}
              className="rounded border border-coc-border px-2.5 py-1 text-xs text-coc-muted hover:text-red-300 hover:border-red-800/60 transition-colors"
            >
              喪失
            </button>
            <button
              onClick={() => onDelete(bond.id)}
              className="ml-auto text-xs text-red-500/50 hover:text-red-400 transition-colors"
            >
              削除
            </button>
          </div>
        </div>
      )}

      {bond.is_lost && (
        <div className="flex items-center gap-2">
          <span className="rounded border border-red-800/60 bg-red-950/20 px-2 py-0.5 text-xs text-red-400 font-semibold">
            喪失済み
          </span>
          <button
            onClick={() => onRestore(bond.id)}
            className="rounded border border-coc-border px-2.5 py-1 text-xs text-coc-muted hover:text-coc-text transition-colors"
          >
            回復
          </button>
          <button
            onClick={() => onDelete(bond.id)}
            className="ml-auto text-xs text-red-500/50 hover:text-red-400 transition-colors"
          >
            削除
          </button>
        </div>
      )}
    </div>
  );
}
