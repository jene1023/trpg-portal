"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { MYTHOS_CREATURES, MythosCreature } from "@/lib/mythosData";

function StatCell({ label, value }: { label: string; value: number | null | string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 min-w-[3rem]">
      <span className="text-[10px] font-cinzel text-coc-muted uppercase">{label}</span>
      <span className="text-sm font-semibold text-coc-text">
        {value ?? "—"}
      </span>
    </div>
  );
}

function CreatureAccordion({ creature }: { creature: MythosCreature }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-coc-border overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-coc-surface hover:bg-coc-raised transition-colors text-left gap-2"
      >
        <div className="flex-1 min-w-0">
          <span className="font-cinzel text-sm font-semibold text-coc-text">{creature.name}</span>
          <span className="ml-2 text-xs text-coc-muted font-crimson">{creature.origin}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-red-400 font-crimson hidden sm:block">
            SAN {creature.san_loss_success} / {creature.san_loss_fail}
          </span>
          {open ? (
            <ChevronUp size={16} className="text-coc-muted" />
          ) : (
            <ChevronDown size={16} className="text-coc-muted" />
          )}
        </div>
      </button>

      {open && (
        <div className="px-4 py-4 bg-coc-raised border-t border-coc-border space-y-4">
          {/* SANチェック */}
          <div className="flex gap-4 flex-wrap">
            <div className="rounded-md bg-coc-surface border border-coc-border px-3 py-2">
              <p className="text-[10px] font-cinzel text-coc-muted uppercase tracking-wider mb-1">SANチェック（成功/失敗）</p>
              <p className="text-sm font-semibold text-red-400">
                {creature.san_loss_success} / {creature.san_loss_fail}
              </p>
            </div>
            {creature.armor && (
              <div className="rounded-md bg-coc-surface border border-coc-border px-3 py-2">
                <p className="text-[10px] font-cinzel text-coc-muted uppercase tracking-wider mb-1">装甲</p>
                <p className="text-sm font-semibold text-coc-text">{creature.armor}</p>
              </div>
            )}
          </div>

          {/* 能力値 */}
          <div>
            <p className="text-[10px] font-cinzel text-coc-gold uppercase tracking-widest mb-2">能力値</p>
            <div className="flex gap-3 flex-wrap rounded-md bg-coc-surface border border-coc-border px-4 py-3">
              <StatCell label="STR" value={creature.str} />
              <StatCell label="CON" value={creature.con} />
              <StatCell label="POW" value={creature.pow} />
              <StatCell label="DEX" value={creature.dex} />
              <StatCell label="SIZ" value={creature.siz} />
              <StatCell label="HP" value={creature.hp} />
              <StatCell label="MP" value={creature.mp} />
            </div>
          </div>

          {/* 攻撃 */}
          <div>
            <p className="text-[10px] font-cinzel text-coc-gold uppercase tracking-widest mb-2">攻撃</p>
            <ul className="space-y-1">
              {creature.attacks.map((atk, i) => (
                <li key={i} className="text-sm text-coc-text font-crimson flex items-start gap-2">
                  <span className="text-coc-gold mt-0.5 shrink-0">✦</span>
                  {atk}
                </li>
              ))}
            </ul>
          </div>

          {/* 備考 */}
          {creature.notes && (
            <div>
              <p className="text-[10px] font-cinzel text-coc-gold uppercase tracking-widest mb-2">備考</p>
              <p className="text-sm text-coc-muted font-crimson leading-relaxed">{creature.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MythosPage() {
  const [query, setQuery] = useState("");

  const filtered = MYTHOS_CREATURES.filter((c) => {
    const q = query.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.origin.toLowerCase().includes(q) ||
      (c.notes ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-8">
      <div>
        <h1 className="font-cinzel text-2xl font-bold text-coc-text mb-1">
          神話辞典
        </h1>
        <p className="font-crimson text-coc-muted italic text-sm">
          CoC 7版 — 神話生物・神格クイックリファレンス
        </p>
      </div>

      {/* 検索 */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-coc-muted pointer-events-none" />
        <input
          type="text"
          placeholder="生物名・出典・特徴で検索..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-coc-border bg-coc-surface text-coc-text text-sm focus:outline-none focus:border-coc-gold placeholder:text-coc-faint"
        />
      </div>

      {/* 件数 */}
      <p className="text-xs text-coc-faint font-crimson">
        全 {MYTHOS_CREATURES.length} 種 — 表示中: {filtered.length} 件
      </p>

      {/* リスト */}
      <section className="space-y-2">
        {filtered.length === 0 ? (
          <p className="text-center py-12 text-coc-faint font-crimson italic text-sm">
            該当する生物が見つかりません
          </p>
        ) : (
          filtered.map((creature) => (
            <CreatureAccordion key={creature.name} creature={creature} />
          ))
        )}
      </section>

      <p className="text-xs text-coc-faint font-crimson text-right">
        ※ 数値はCoC 7版基準の代表値です。シナリオによって異なる場合があります。
      </p>
    </div>
  );
}
