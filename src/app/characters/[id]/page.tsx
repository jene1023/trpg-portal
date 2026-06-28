export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { calcDamageBonus, calcBuild, calcMov } from "@/lib/coc-calc";
import StatusBadge from "@/app/_components/StatusBadge";
import PortraitImage from "@/app/_components/PortraitImage";
import StatBlock from "@/app/_components/StatBlock";
import DerivedStatBar from "@/app/_components/DerivedStatBar";
import SkillList from "@/app/_components/SkillList";
import QuickStatEditor from "@/app/_components/QuickStatEditor";
import DiceRoller from "@/app/_components/DiceRoller";

type Props = { params: Promise<{ id: string }> };

export default async function CharacterDetailPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: char } = await supabase
    .from("characters")
    .select("*")
    .eq("id", id)
    .single();

  if (!char) notFound();

  const { data: skills } = await supabase
    .from("character_skills")
    .select("*")
    .eq("character_id", id);

  const db = calcDamageBonus(char.str, char.siz);
  const build = calcBuild(char.str, char.siz);
  const mov = calcMov(char.str, char.dex, char.siz);

  const sectionClass = "rounded-lg border border-coc-border bg-coc-surface p-4 space-y-4";
  const sectionTitle = "font-cinzel text-sm font-semibold text-coc-muted uppercase tracking-widest";
  const divider = "border-t border-coc-border my-2";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* ブレッドクラム */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/characters"
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          一覧へ
        </Link>
        <Link
          href={`/characters/${id}/edit`}
          className="flex items-center gap-1.5 rounded-lg border border-coc-border px-3 py-1.5 text-sm text-coc-muted hover:text-coc-text hover:border-coc-border-glow transition-colors"
        >
          <Pencil size={14} />
          編集
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
        {/* 左カラム: ポートレート + 基本情報 */}
        <div className="space-y-4">
          <div className="relative aspect-[3/4] rounded-lg overflow-hidden border border-coc-border">
            <PortraitImage url={char.portrait_url} name={char.name} />
          </div>

          <div className={sectionClass}>
            <div>
              <h1 className="font-cinzel text-xl font-bold text-coc-text leading-tight">
                {char.name}
              </h1>
              <div className="flex items-center gap-2 mt-1.5">
                <StatusBadge status={char.status} />
                {char.occupation && (
                  <span className="text-xs text-coc-muted">{char.occupation}</span>
                )}
              </div>
            </div>

            {char.catchphrase && (
              <p className="font-crimson italic text-coc-gold text-sm leading-relaxed border-l-2 border-coc-gold-dim pl-3">
                &ldquo;{char.catchphrase}&rdquo;
              </p>
            )}

            <div className={divider} />

            <dl className="space-y-1.5 text-sm">
              {char.age && (
                <div className="flex justify-between">
                  <dt className="text-coc-muted">年齢</dt>
                  <dd className="text-coc-text">{char.age}歳</dd>
                </div>
              )}
              {char.gender && (
                <div className="flex justify-between">
                  <dt className="text-coc-muted">性別</dt>
                  <dd className="text-coc-text">{char.gender}</dd>
                </div>
              )}
              {char.player_name && (
                <div className="flex justify-between">
                  <dt className="text-coc-muted">PL</dt>
                  <dd className="text-coc-text">{char.player_name}</dd>
                </div>
              )}
              {char.scenario_name && (
                <div className="flex justify-between">
                  <dt className="text-coc-muted">シナリオ</dt>
                  <dd className="text-coc-text text-right max-w-[140px] leading-tight">{char.scenario_name}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* 右カラム */}
        <div className="space-y-4">
          {/* 能力値 */}
          <div className={sectionClass}>
            <h2 className={sectionTitle}>能力値</h2>
            <StatBlock character={char} />
          </div>

          {/* 派生ステータス */}
          <div className={sectionClass}>
            <h2 className={sectionTitle}>派生ステータス</h2>
            <div className="space-y-3">
              <DerivedStatBar label="HP 耐久力" current={char.hp_current} max={char.hp_max} color="hp" />
              <DerivedStatBar label="MP マジックポイント" current={char.mp_current} max={char.mp_max} color="mp" />
              <DerivedStatBar label={`SAN 正気度（初期${char.san_start}）`} current={char.san_current} max={char.san_max} color="san" />
            </div>
            <div className={divider} />
            <QuickStatEditor
              characterId={char.id}
              hpCurrent={char.hp_current}
              hpMax={char.hp_max}
              mpCurrent={char.mp_current}
              mpMax={char.mp_max}
              sanCurrent={char.san_current}
              sanMax={char.san_max}
            />
            <div className="grid grid-cols-3 gap-2 pt-2">
              {[
                { label: "幸運", value: char.luck },
                { label: "ダメージボーナス", value: db },
                { label: "ビルド", value: build },
                { label: "移動力", value: mov },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-md bg-coc-raised border border-coc-border p-2 text-center">
                  <p className="text-xs text-coc-muted">{label}</p>
                  <p className="text-lg font-bold text-coc-text">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 技能 */}
          <div className={sectionClass}>
            <h2 className={sectionTitle}>技能</h2>
            {(skills ?? []).length > 0 && (
              <>
                <DiceRoller skills={skills ?? []} />
                <div className={divider} />
              </>
            )}
            <SkillList skills={skills ?? []} />
          </div>

          {/* 背景・メモ */}
          {(char.background || char.notes) && (
            <div className={sectionClass}>
              <h2 className={sectionTitle}>背景・メモ</h2>
              {char.background && (
                <div>
                  <p className="text-xs text-coc-muted mb-1">背景・経歴</p>
                  <p className="font-crimson text-coc-text leading-relaxed whitespace-pre-wrap text-[15px]">
                    {char.background}
                  </p>
                </div>
              )}
              {char.notes && (
                <div>
                  <p className="text-xs text-coc-muted mb-1">メモ</p>
                  <p className="font-crimson text-coc-text leading-relaxed whitespace-pre-wrap text-[15px]">
                    {char.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
