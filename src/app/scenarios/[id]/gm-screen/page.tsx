export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Monitor } from "lucide-react";
import {
  supabase,
  isSupabaseConfigured,
  Character,
  ScenarioParticipant,
  Npc,
  Creature,
  Handout,
} from "@/lib/supabase";

type ParticipantWithCharacter = ScenarioParticipant & {
  characters: Character;
};

type Props = { params: Promise<{ id: string }> };

function barColor(current: number, max: number): string {
  if (max <= 0) return "bg-coc-border";
  const ratio = current / max;
  if (ratio > 0.5) return "bg-green-500";
  if (ratio > 0.25) return "bg-yellow-400";
  return "bg-red-500";
}

function textColor(current: number, max: number): string {
  if (max <= 0) return "text-coc-muted";
  const ratio = current / max;
  if (ratio > 0.5) return "text-green-400";
  if (ratio > 0.25) return "text-yellow-400";
  return "text-red-400";
}

function pct(current: number, max: number): number {
  if (max <= 0) return 0;
  return Math.min(100, (current / max) * 100);
}

export default async function GmScreenPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: scenario } = await supabase
    .from("scenarios")
    .select("id, title")
    .eq("id", id)
    .single();

  if (!scenario) notFound();

  const [
    { data: participants },
    { data: handouts },
    { data: npcs },
    { data: creatures },
  ] = await Promise.all([
    supabase
      .from("scenario_participants")
      .select("*, characters(*)")
      .eq("scenario_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("handouts")
      .select("*")
      .eq("scenario_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("npcs")
      .select("*")
      .eq("scenario_name", scenario.title)
      .order("created_at", { ascending: true }),
    supabase
      .from("creatures")
      .select("*")
      .eq("scenario_id", id)
      .order("created_at", { ascending: true }),
  ]);

  const participantList = (participants ?? []) as ParticipantWithCharacter[];
  const handoutList = (handouts ?? []) as Handout[];
  const npcList = (npcs ?? []) as Npc[];
  const creatureList = (creatures ?? []) as Creature[];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/scenarios/${id}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          シナリオ詳細
        </Link>
      </div>

      <div className="mb-6">
        <p className="text-xs text-coc-muted mb-1">{scenario.title}</p>
        <h1 className="font-cinzel text-xl font-bold text-coc-text flex items-center gap-2">
          <Monitor size={22} className="text-coc-gold" />
          GMスクリーン
        </h1>
        <p className="text-xs text-coc-muted mt-1">
          NPC・クリーチャー・パーティー・ハンドアウトをセッション中に一画面で確認
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Party */}
        <section>
          <h2 className="font-cinzel text-xs font-semibold text-coc-gold uppercase tracking-widest mb-3">
            パーティー ({participantList.length})
          </h2>
          {participantList.length === 0 ? (
            <div className="rounded-xl border border-coc-border bg-coc-surface px-4 py-4 text-center text-coc-muted text-sm">
              参加キャラクターなし
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {participantList.map(({ characters: char }) => (
                <div
                  key={char.id}
                  className="rounded-xl border border-coc-border bg-coc-surface px-4 py-3"
                >
                  <p className="font-medium text-coc-text text-sm mb-2">{char.name}</p>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="w-8 text-coc-muted shrink-0">HP</span>
                      <div className="flex-1 h-2 rounded-full bg-coc-border overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${barColor(char.hp_current, char.hp_max)}`}
                          style={{ width: `${pct(char.hp_current, char.hp_max)}%` }}
                        />
                      </div>
                      <span className={`font-mono w-12 text-right ${textColor(char.hp_current, char.hp_max)}`}>
                        {char.hp_current}/{char.hp_max}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="w-8 text-coc-muted shrink-0">SAN</span>
                      <div className="flex-1 h-2 rounded-full bg-coc-border overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${barColor(char.san_current, char.san_max)}`}
                          style={{ width: `${pct(char.san_current, char.san_max)}%` }}
                        />
                      </div>
                      <span className={`font-mono w-12 text-right ${textColor(char.san_current, char.san_max)}`}>
                        {char.san_current}/{char.san_max}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="w-8 text-coc-muted shrink-0">MP</span>
                      <div className="flex-1 h-2 rounded-full bg-coc-border overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-500 transition-all"
                          style={{ width: `${pct(char.mp_current, char.mp_max)}%` }}
                        />
                      </div>
                      <span className="font-mono w-12 text-right text-blue-400">
                        {char.mp_current}/{char.mp_max}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Handouts */}
        <section>
          <h2 className="font-cinzel text-xs font-semibold text-coc-gold uppercase tracking-widest mb-3">
            ハンドアウト ({handoutList.length})
          </h2>
          {handoutList.length === 0 ? (
            <div className="rounded-xl border border-coc-border bg-coc-surface px-4 py-4 text-center text-coc-muted text-sm">
              ハンドアウトなし
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {handoutList.map((h) => (
                <div
                  key={h.id}
                  className={`rounded-xl border px-4 py-3 flex items-center justify-between gap-3 ${
                    h.is_distributed
                      ? "border-coc-border bg-coc-surface opacity-60"
                      : "border-coc-gold-dim bg-coc-raised"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm text-coc-text font-medium truncate">{h.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {h.recipient_name && (
                        <span className="text-xs text-coc-muted">→ {h.recipient_name}</span>
                      )}
                      {h.is_secret && (
                        <span className="text-xs text-red-400">秘匿</span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium border ${
                      h.is_distributed
                        ? "border-green-800 text-green-400"
                        : "border-yellow-700 text-yellow-400"
                    }`}
                  >
                    {h.is_distributed ? "配布済" : "未配布"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* NPCs */}
        <section className="md:col-span-2">
          <h2 className="font-cinzel text-xs font-semibold text-coc-gold uppercase tracking-widest mb-3">
            NPC ({npcList.length})
          </h2>
          {npcList.length === 0 ? (
            <div className="rounded-xl border border-coc-border bg-coc-surface px-4 py-4 text-center text-coc-muted text-sm">
              NPCなし
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {npcList.map((npc) => (
                <div
                  key={npc.id}
                  className="rounded-xl border border-coc-border bg-coc-surface px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-medium text-coc-text text-sm">{npc.name}</p>
                    {npc.faction && (
                      <span className="text-xs text-coc-muted border border-coc-border rounded-full px-2 py-0.5 shrink-0">
                        {npc.faction}
                      </span>
                    )}
                  </div>
                  {(npc.str != null ||
                    npc.con != null ||
                    npc.pow != null ||
                    npc.dex != null ||
                    npc.hp != null ||
                    npc.mp != null ||
                    npc.db != null) && (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs mt-2 border-t border-coc-border pt-2">
                      {npc.str != null && (
                        <div className="flex justify-between">
                          <span className="text-coc-muted">STR</span>
                          <span className="font-mono text-coc-text">{npc.str}</span>
                        </div>
                      )}
                      {npc.con != null && (
                        <div className="flex justify-between">
                          <span className="text-coc-muted">CON</span>
                          <span className="font-mono text-coc-text">{npc.con}</span>
                        </div>
                      )}
                      {npc.pow != null && (
                        <div className="flex justify-between">
                          <span className="text-coc-muted">POW</span>
                          <span className="font-mono text-coc-text">{npc.pow}</span>
                        </div>
                      )}
                      {npc.dex != null && (
                        <div className="flex justify-between">
                          <span className="text-coc-muted">DEX</span>
                          <span className="font-mono text-coc-text">{npc.dex}</span>
                        </div>
                      )}
                      {npc.hp != null && (
                        <div className="flex justify-between">
                          <span className="text-coc-muted">HP</span>
                          <span className="font-mono text-coc-text">{npc.hp}</span>
                        </div>
                      )}
                      {npc.mp != null && (
                        <div className="flex justify-between">
                          <span className="text-coc-muted">MP</span>
                          <span className="font-mono text-coc-text">{npc.mp}</span>
                        </div>
                      )}
                      {npc.db != null && (
                        <div className="flex justify-between">
                          <span className="text-coc-muted">DB</span>
                          <span className="font-mono text-coc-text">{npc.db}</span>
                        </div>
                      )}
                    </div>
                  )}
                  {npc.purpose && (
                    <p className="text-xs text-coc-muted mt-2 line-clamp-2">{npc.purpose}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Creatures */}
        <section className="md:col-span-2">
          <h2 className="font-cinzel text-xs font-semibold text-coc-gold uppercase tracking-widest mb-3">
            クリーチャー ({creatureList.length})
          </h2>
          {creatureList.length === 0 ? (
            <div className="rounded-xl border border-coc-border bg-coc-surface px-4 py-4 text-center text-coc-muted text-sm">
              クリーチャーなし
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {creatureList.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-coc-border bg-coc-surface px-4 py-3"
                >
                  <p className="font-medium text-coc-text text-sm mb-2">{c.name}</p>
                  {(c.san_loss_success || c.san_loss_failure) && (
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {c.san_loss_success && (
                        <span className="text-xs rounded-full border border-yellow-700 bg-yellow-900/20 px-2 py-0.5 text-yellow-400">
                          成功: {c.san_loss_success}
                        </span>
                      )}
                      {c.san_loss_failure && (
                        <span className="text-xs rounded-full border border-red-800 bg-red-900/20 px-2 py-0.5 text-red-400">
                          失敗: {c.san_loss_failure}
                        </span>
                      )}
                    </div>
                  )}
                  {(c.str != null ||
                    c.dex != null ||
                    c.hp != null ||
                    c.mp != null ||
                    c.armor) && (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs border-t border-coc-border pt-2">
                      {c.str != null && (
                        <div className="flex justify-between">
                          <span className="text-coc-muted">STR</span>
                          <span className="font-mono text-coc-text">{c.str}</span>
                        </div>
                      )}
                      {c.dex != null && (
                        <div className="flex justify-between">
                          <span className="text-coc-muted">DEX</span>
                          <span className="font-mono text-coc-text">{c.dex}</span>
                        </div>
                      )}
                      {c.hp != null && (
                        <div className="flex justify-between">
                          <span className="text-coc-muted">HP</span>
                          <span className="font-mono text-coc-text">{c.hp}</span>
                        </div>
                      )}
                      {c.mp != null && (
                        <div className="flex justify-between">
                          <span className="text-coc-muted">MP</span>
                          <span className="font-mono text-coc-text">{c.mp}</span>
                        </div>
                      )}
                      {c.armor && (
                        <div className="flex justify-between col-span-2">
                          <span className="text-coc-muted">装甲</span>
                          <span className="font-mono text-coc-text">{c.armor}</span>
                        </div>
                      )}
                    </div>
                  )}
                  {c.attacks && (
                    <p className="text-xs text-coc-muted mt-2 line-clamp-2">{c.attacks}</p>
                  )}
                  {c.can_use_spells && (
                    <p className="text-xs text-purple-400 mt-1">呪文使用可</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
