"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Plus, Star, Lock, Skull } from "lucide-react";
import { Creature } from "@/lib/supabase";
import CreatureForm from "@/app/_components/CreatureForm";

type Props = {
  scenarioId: string;
  initialCreatures: Creature[];
};

function HpBar({ hp }: { hp: number | null }) {
  if (hp === null) return null;
  const pct = Math.min(100, Math.max(0, (hp / Math.max(hp, 20)) * 100));
  return (
    <div className="flex items-center gap-2 mt-1.5">
      <span className="text-xs text-coc-muted w-6">HP</span>
      <div className="flex-1 rounded-full bg-coc-bg h-2 overflow-hidden border border-coc-border">
        <div
          className="h-full rounded-full bg-red-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-coc-muted w-6 text-right">{hp}</span>
    </div>
  );
}

function FearStars({ rating }: { rating: number | null }) {
  if (!rating) return null;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={12}
          className={n <= rating ? "text-coc-gold fill-coc-gold" : "text-coc-muted"}
        />
      ))}
      <span className="ml-1 text-xs text-coc-muted">恐怖度 {rating}/5</span>
    </div>
  );
}

function CreatureCard({ creature }: { creature: Creature }) {
  const [secretOpen, setSecretOpen] = useState(false);

  return (
    <div className="rounded-xl border border-coc-border bg-coc-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Skull size={16} className="text-coc-gold flex-shrink-0 mt-0.5" />
          <h3 className="font-medium text-coc-text">{creature.name}</h3>
        </div>
        {creature.can_use_spells && (
          <span className="rounded-full border border-purple-800 bg-purple-950/30 px-2 py-0.5 text-xs text-purple-400 flex-shrink-0">
            呪文使用可
          </span>
        )}
      </div>

      {creature.fear_rating !== null && <FearStars rating={creature.fear_rating} />}
      <HpBar hp={creature.hp} />

      {(creature.san_loss_success || creature.san_loss_failure) && (
        <p className="mt-2 text-xs text-coc-muted">
          SAN喪失: 成功 {creature.san_loss_success ?? "—"} / 失敗 {creature.san_loss_failure ?? "—"}
        </p>
      )}

      {/* 能力値グリッド */}
      {(creature.str || creature.con || creature.pow || creature.dex || creature.siz) && (
        <div className="mt-3 grid grid-cols-5 gap-1.5">
          {(["str", "con", "pow", "dex", "siz"] as const).map((key) => {
            const v = creature[key];
            if (!v) return null;
            return (
              <div key={key} className="rounded border border-coc-border bg-coc-bg text-center py-1">
                <p className="text-xs text-coc-muted uppercase">{key}</p>
                <p className="text-sm font-medium text-coc-text">{v}</p>
              </div>
            );
          })}
        </div>
      )}

      {creature.armor && (
        <p className="mt-2 text-xs text-coc-muted">装甲: {creature.armor}</p>
      )}

      {creature.attacks && (
        <div className="mt-2">
          <p className="text-xs text-coc-muted font-medium mb-0.5">攻撃</p>
          <p className="text-xs text-coc-text whitespace-pre-line">{creature.attacks}</p>
        </div>
      )}

      {creature.mythos_background && (
        <p className="mt-2 text-xs text-coc-muted whitespace-pre-line">{creature.mythos_background}</p>
      )}

      {creature.notes && (
        <p className="mt-2 text-xs text-coc-text whitespace-pre-line border-t border-coc-border pt-2">
          {creature.notes}
        </p>
      )}

      {/* 秘匿情報（KP専用） */}
      {creature.secret_notes && (
        <div className="mt-3 border-t border-coc-border pt-2">
          <button
            type="button"
            onClick={() => setSecretOpen((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-coc-muted hover:text-coc-gold transition-colors"
          >
            <Lock size={11} />
            <span>KP秘匿情報</span>
            {secretOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
          {secretOpen && (
            <p className="mt-2 rounded-lg border border-yellow-900 bg-yellow-950/20 px-3 py-2 text-xs text-yellow-300 whitespace-pre-line">
              {creature.secret_notes}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function ScenarioCreatureList({ scenarioId, initialCreatures }: Props) {
  const [creatures, setCreatures] = useState<Creature[]>(initialCreatures);
  const [showForm, setShowForm] = useState(false);

  function handleSuccess() {
    setShowForm(false);
    // Reload the page to get fresh data
    window.location.reload();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-coc-muted">{creatures.length}体登録済み</p>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg border border-coc-gold-dim bg-coc-raised px-3 py-1.5 text-sm text-coc-gold hover:bg-coc-surface hover:border-coc-gold transition-colors"
        >
          <Plus size={14} />
          {showForm ? "キャンセル" : "クリーチャーを追加"}
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-xl border border-coc-gold-dim bg-coc-raised p-5">
          <h2 className="font-cinzel text-sm font-medium text-coc-gold mb-4">新しいクリーチャーを登録</h2>
          <CreatureForm
            scenarioId={scenarioId}
            onSuccess={handleSuccess}
          />
        </div>
      )}

      {creatures.length === 0 && !showForm && (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-10 text-center">
          <Skull size={32} className="text-coc-muted mx-auto mb-3" />
          <p className="text-sm text-coc-muted">まだクリーチャーが登録されていません</p>
          <p className="text-xs text-coc-muted mt-1">「クリーチャーを追加」ボタンから登録してください</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {creatures.map((c) => (
          <CreatureCard key={c.id} creature={c} />
        ))}
      </div>
    </div>
  );
}
