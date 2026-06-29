export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase, isSupabaseConfigured, Npc } from "@/lib/supabase";
import NpcQuickRoller from "@/app/_components/NpcQuickRoller";

type Props = { params: Promise<{ id: string }> };

const STAT_DISPLAY: { key: keyof Npc; label: string }[] = [
  { key: "str", label: "STR" },
  { key: "con", label: "CON" },
  { key: "pow", label: "POW" },
  { key: "dex", label: "DEX" },
  { key: "app", label: "APP" },
  { key: "siz", label: "SIZ" },
  { key: "int_stat", label: "INT" },
  { key: "edu", label: "EDU" },
  { key: "hp", label: "HP" },
  { key: "mp", label: "MP" },
];

function hasStats(npc: Npc): boolean {
  return STAT_DISPLAY.some(({ key }) => npc[key] !== null);
}

function buildPresetSkills(npc: Npc) {
  return STAT_DISPLAY.filter(({ key }) => npc[key] !== null).map(({ key, label }) => ({
    name: label,
    value: npc[key] as number,
  }));
}

export default async function NpcDetailPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: npc } = await supabase
    .from("npcs")
    .select("*")
    .eq("id", id)
    .single();

  if (!npc) notFound();

  const presetSkills = buildPresetSkills(npc as Npc);

  return (
    <div className="coc-page-enter mx-auto max-w-3xl px-4 py-8">
      {/* ブレッドクラム */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/npcs"
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          NPC 一覧
        </Link>
      </div>

      {/* ヘッダー */}
      <div className="mb-6">
        <h1 className="font-cinzel text-2xl font-bold text-coc-text leading-tight">
          {npc.name}
        </h1>
        {npc.scenario_name && (
          <p className="text-sm text-coc-gold mt-1">{npc.scenario_name}</p>
        )}
      </div>

      <div className="space-y-4">
        {/* 外見・目的・メモ */}
        {(npc.appearance || npc.purpose || npc.notes) && (
          <div className="rounded-lg border border-coc-border bg-coc-surface p-4 space-y-3">
            <h2 className="font-cinzel text-sm font-semibold text-coc-muted uppercase tracking-widest">
              基本情報
            </h2>
            {npc.appearance && (
              <div>
                <p className="text-xs font-medium text-coc-muted mb-0.5">外見</p>
                <p className="text-sm text-coc-text">{npc.appearance}</p>
              </div>
            )}
            {npc.purpose && (
              <div>
                <p className="text-xs font-medium text-coc-muted mb-0.5">目的</p>
                <p className="text-sm text-coc-text">{npc.purpose}</p>
              </div>
            )}
            {npc.notes && (
              <div>
                <p className="text-xs font-medium text-coc-muted mb-0.5">KP メモ</p>
                <p className="text-sm text-coc-text whitespace-pre-wrap">{npc.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* 能力値 */}
        {hasStats(npc as Npc) && (
          <div className="rounded-lg border border-coc-border bg-coc-surface p-4 space-y-3">
            <h2 className="font-cinzel text-sm font-semibold text-coc-muted uppercase tracking-widest">
              能力値
            </h2>
            <div className="grid grid-cols-5 sm:grid-cols-6 gap-3">
              {STAT_DISPLAY.filter(({ key }) => (npc as Npc)[key] !== null).map(({ key, label }) => (
                <div
                  key={key}
                  className="flex flex-col items-center rounded-md border border-coc-border bg-coc-raised px-2 py-2"
                >
                  <span className="text-xs text-coc-muted mb-1">{label}</span>
                  <span className="font-cinzel text-lg font-bold text-coc-text">
                    {(npc as Npc)[key] as number}
                  </span>
                </div>
              ))}
              {npc.db && (
                <div className="flex flex-col items-center rounded-md border border-coc-border bg-coc-raised px-2 py-2">
                  <span className="text-xs text-coc-muted mb-1">DB</span>
                  <span className="font-cinzel text-base font-bold text-coc-text">
                    {npc.db}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* クイックダイスロール */}
        <div className="rounded-lg border border-coc-border bg-coc-surface p-4 space-y-3">
          <h2 className="font-cinzel text-sm font-semibold text-coc-muted uppercase tracking-widest">
            クイックダイスロール
          </h2>
          <NpcQuickRoller presetSkills={presetSkills} />
        </div>
      </div>
    </div>
  );
}
