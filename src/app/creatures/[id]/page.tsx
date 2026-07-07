export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Skull } from "lucide-react";
import { supabase, isSupabaseConfigured, Creature, Scenario } from "@/lib/supabase";
import CreatureSanCheckButton from "@/app/_components/CreatureSanCheckButton";

const STAT_DISPLAY: { key: keyof Creature; label: string }[] = [
  { key: "str", label: "STR" },
  { key: "con", label: "CON" },
  { key: "pow", label: "POW" },
  { key: "dex", label: "DEX" },
  { key: "siz", label: "SIZ" },
  { key: "hp", label: "HP" },
  { key: "mp", label: "MP" },
];

function hasStats(creature: Creature): boolean {
  return STAT_DISPLAY.some(({ key }) => creature[key] !== null);
}

type Props = { params: Promise<{ id: string }> };

export default async function CreatureDetailPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: creature } = await supabase
    .from("creatures")
    .select("*")
    .eq("id", id)
    .single();

  if (!creature) notFound();

  const typedCreature = creature as Creature;

  let scenarioTitle: string | null = null;
  if (typedCreature.scenario_id) {
    const { data: scenario } = await supabase
      .from("scenarios")
      .select("title")
      .eq("id", typedCreature.scenario_id)
      .single();
    scenarioTitle = (scenario as Scenario | null)?.title ?? null;
  }

  return (
    <div className="coc-page-enter mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/creatures"
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          クリーチャー一覧
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="font-cinzel text-2xl font-bold text-coc-text leading-tight">
          {typedCreature.name}
        </h1>
        {scenarioTitle && (
          <p className="text-sm text-coc-gold mt-1">{scenarioTitle}</p>
        )}
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          {(typedCreature.san_loss_success || typedCreature.san_loss_failure) && (
            <span className="rounded-full border border-red-800 bg-red-950/30 px-3 py-1 text-xs font-medium text-red-400">
              SAN喪失: {typedCreature.san_loss_success ?? "—"} / {typedCreature.san_loss_failure ?? "—"}
            </span>
          )}
          {typedCreature.can_use_spells && (
            <span className="rounded-full border border-purple-800 bg-purple-950/30 px-3 py-1 text-xs font-medium text-purple-400">
              呪文使用可
            </span>
          )}
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-3">
        {typedCreature.scenario_id && typedCreature.hp !== null && (
          <Link
            href={`/scenarios/${typedCreature.scenario_id}/enemy-tracker?name=${encodeURIComponent(typedCreature.name)}&hp=${typedCreature.hp}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-coc-gold bg-coc-gold/10 px-4 py-2 text-sm font-medium text-coc-gold hover:bg-coc-gold/20 transition-colors"
          >
            <Skull size={15} />
            このシナリオの戦闘トラッカーに敵として追加
          </Link>
        )}
        {(typedCreature.san_loss_success || typedCreature.san_loss_failure) && (
          <CreatureSanCheckButton
            sanLossSuccess={typedCreature.san_loss_success}
            sanLossFailure={typedCreature.san_loss_failure}
          />
        )}
      </div>

      <div className="space-y-4">
        {typedCreature.mythos_background && (
          <div className="rounded-lg border border-coc-border bg-coc-surface p-4">
            <h2 className="font-cinzel text-sm font-semibold text-coc-muted uppercase tracking-widest mb-2">
              神話的背景
            </h2>
            <p className="text-sm text-coc-text whitespace-pre-wrap">{typedCreature.mythos_background}</p>
          </div>
        )}

        {/* StatBlock */}
        {hasStats(typedCreature) && (
          <div className="rounded-lg border border-coc-border bg-coc-surface p-4">
            <h2 className="font-cinzel text-sm font-semibold text-coc-muted uppercase tracking-widest mb-3">
              能力値
            </h2>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
              {STAT_DISPLAY.filter(({ key }) => typedCreature[key] !== null).map(({ key, label }) => (
                <div
                  key={key}
                  className="flex flex-col items-center rounded-md border border-coc-border bg-coc-raised px-2 py-2"
                >
                  <span className="text-xs text-coc-muted mb-1">{label}</span>
                  <span className="font-cinzel text-xl font-bold text-coc-text">
                    {typedCreature[key] as number}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {(typedCreature.attacks || typedCreature.armor) && (
          <div className="rounded-lg border border-coc-border bg-coc-surface p-4 space-y-3">
            <h2 className="font-cinzel text-sm font-semibold text-coc-muted uppercase tracking-widest">
              戦闘
            </h2>
            {typedCreature.attacks && (
              <div>
                <p className="text-xs font-medium text-coc-muted mb-0.5">攻撃</p>
                <p className="text-sm text-coc-text whitespace-pre-wrap">{typedCreature.attacks}</p>
              </div>
            )}
            {typedCreature.armor && (
              <div>
                <p className="text-xs font-medium text-coc-muted mb-0.5">装甲</p>
                <p className="text-sm text-coc-text">{typedCreature.armor}</p>
              </div>
            )}
          </div>
        )}

        {typedCreature.notes && (
          <div className="rounded-lg border border-coc-border bg-coc-raised p-4">
            <h2 className="font-cinzel text-sm font-semibold text-coc-muted uppercase tracking-widest mb-2">
              KP メモ
            </h2>
            <p className="text-sm text-coc-text whitespace-pre-wrap">{typedCreature.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
