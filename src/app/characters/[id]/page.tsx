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
import SpecialRoller from "@/app/_components/SpecialRoller";
import ExportButton from "@/app/_components/ExportButton";
import PdfExportButton from "@/app/_components/PdfExportButton";
import DuplicateButton from "@/app/_components/DuplicateButton";

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
  const sectionTitle = "coc-section-title font-cinzel text-sm font-semibold text-coc-muted uppercase tracking-widest";
  const divider = "border-t border-coc-border my-2";

  return (
    <div className="coc-page-enter mx-auto max-w-5xl px-4 py-8">
      {/* ブレッドクラム */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/characters"
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          一覧へ
        </Link>
        <div className="flex items-center gap-2">
          <PdfExportButton characterId={id} />
          <ExportButton characterId={id} characterName={char.name} />
          <DuplicateButton characterId={id} />
          <Link
            href={`/characters/${id}/edit`}
            className="flex items-center gap-1.5 rounded-lg border border-coc-border px-3 py-1.5 text-sm text-coc-muted hover:text-coc-text hover:border-coc-border-glow transition-colors"
          >
            <Pencil size={14} />
            編集
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
        {/* 左カラム: ポートレート + 基本情報 */}
        <div className="space-y-4">
          <div className="relative aspect-[3/4] rounded-lg overflow-hidden border border-coc-border">
            <PortraitImage url={char.portrait_url} name={char.name} />
            <div className="absolute inset-0 pointer-events-none coc-portrait-vignette" />
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
                <DiceRoller skills={skills ?? []} characterId={id} />
                <div className={divider} />
              </>
            )}
            <div>
              <p className="text-xs text-coc-muted font-semibold mb-2">特殊ロール（プッシュ／対抗）</p>
              <SpecialRoller skills={skills ?? []} characterId={id} />
            </div>
            <div className={divider} />
            <SkillList skills={skills ?? []} characterId={id} />
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

          {/* セッション前確認 / クイックビュー / セッションログ / 狂気記録 リンク */}
          <Link
            href={`/characters/${id}/preflight`}
            className="flex items-center justify-between rounded-lg border border-coc-gold/40 bg-coc-gold/5 px-4 py-3 text-sm text-coc-text hover:border-coc-gold/70 hover:bg-coc-gold/10 transition-colors"
          >
            <span className="font-semibold">セッション前確認</span>
            <span className="text-coc-gold">→</span>
          </Link>
          <Link
            href={`/characters/${id}/quick`}
            className="flex items-center justify-between rounded-lg border border-coc-border bg-coc-surface px-4 py-3 text-sm text-coc-muted hover:text-coc-text hover:border-coc-border-glow transition-colors"
          >
            <span>クイックビュー（セッション中）</span>
            <span className="text-coc-gold">→</span>
          </Link>
          <Link
            href={`/characters/${id}/sessions`}
            className="flex items-center justify-between rounded-lg border border-coc-border bg-coc-surface px-4 py-3 text-sm text-coc-muted hover:text-coc-text hover:border-coc-border-glow transition-colors"
          >
            <span>セッションログ</span>
            <span className="text-coc-gold">→</span>
          </Link>
          <Link
            href={`/characters/${id}/relations`}
            className="flex items-center justify-between rounded-lg border border-coc-border bg-coc-surface px-4 py-3 text-sm text-coc-muted hover:text-coc-text hover:border-coc-border-glow transition-colors"
          >
            <span>関係メモ</span>
            <span className="text-coc-gold">→</span>
          </Link>
          <Link
            href={`/characters/${id}/madness`}
            className={`flex items-center justify-between rounded-lg border px-4 py-3 text-sm transition-colors ${
              char.san_current <= Math.floor(char.san_max / 5)
                ? "border-red-800 bg-red-950/20 text-red-300 hover:text-red-200 hover:border-red-700"
                : "border-coc-border bg-coc-surface text-coc-muted hover:text-coc-text hover:border-coc-border-glow"
            }`}
          >
            <span className="flex items-center gap-2">
              狂気記録
              {char.san_current <= Math.floor(char.san_max / 5) && (
                <span className="rounded bg-red-900/60 border border-red-700 px-1.5 py-0.5 text-xs font-semibold">
                  SAN危険
                </span>
              )}
            </span>
            <span className={char.san_current <= Math.floor(char.san_max / 5) ? "text-red-400" : "text-coc-gold"}>→</span>
          </Link>
          <Link
            href={`/characters/${id}/inventory`}
            className="flex items-center justify-between rounded-lg border border-coc-border bg-coc-surface px-4 py-3 text-sm text-coc-muted hover:text-coc-text hover:border-coc-border-glow transition-colors"
          >
            <span>武器・所持品</span>
            <span className="text-coc-gold">→</span>
          </Link>
          <Link
            href={`/characters/${id}/chat-palette`}
            className="flex items-center justify-between rounded-lg border border-coc-border bg-coc-surface px-4 py-3 text-sm text-coc-muted hover:text-coc-text hover:border-coc-border-glow transition-colors"
          >
            <span>チャットパレット（VTT用）</span>
            <span className="text-coc-gold">→</span>
          </Link>
          <Link
            href={`/characters/${id}/profile-card`}
            className="flex items-center justify-between rounded-lg border border-coc-border bg-coc-surface px-4 py-3 text-sm text-coc-muted hover:text-coc-text hover:border-coc-border-glow transition-colors"
          >
            <span>紹介カード（SNS共有）</span>
            <span className="text-coc-gold">→</span>
          </Link>
          <Link
            href={`/characters/${id}/timeline`}
            className="flex items-center justify-between rounded-lg border border-coc-border bg-coc-surface px-4 py-3 text-sm text-coc-muted hover:text-coc-text hover:border-coc-border-glow transition-colors"
          >
            <span>年表（セッション時系列）</span>
            <span className="text-coc-gold">→</span>
          </Link>
          <Link
            href={`/characters/${id}/stats-graph`}
            className="flex items-center justify-between rounded-lg border border-coc-border bg-coc-surface px-4 py-3 text-sm text-coc-muted hover:text-coc-text hover:border-coc-border-glow transition-colors"
          >
            <span>推移グラフ（HP/SAN）</span>
            <span className="text-coc-gold">→</span>
          </Link>
          <Link
            href={`/characters/${id}/traits`}
            className="flex items-center justify-between rounded-lg border border-coc-border bg-coc-surface px-4 py-3 text-sm text-coc-muted hover:text-coc-text hover:border-coc-border-glow transition-colors"
          >
            <span>特質・重要情報</span>
            <span className="text-coc-gold">→</span>
          </Link>
          <Link
            href={`/characters/${id}/dice-history`}
            className="flex items-center justify-between rounded-lg border border-coc-border bg-coc-surface px-4 py-3 text-sm text-coc-muted hover:text-coc-text hover:border-coc-border-glow transition-colors"
          >
            <span>ダイスロール履歴</span>
            <span className="text-coc-gold">→</span>
          </Link>
          <Link
            href={`/characters/${id}/dice-stats`}
            className="flex items-center justify-between rounded-lg border border-coc-border bg-coc-surface px-4 py-3 text-sm text-coc-muted hover:text-coc-text hover:border-coc-border-glow transition-colors"
          >
            <span>判定統計</span>
            <span className="text-coc-gold">→</span>
          </Link>
          <Link
            href={`/characters/${id}/quick-notes`}
            className="flex items-center justify-between rounded-lg border border-coc-border bg-coc-surface px-4 py-3 text-sm text-coc-muted hover:text-coc-text hover:border-coc-border-glow transition-colors"
          >
            <span>クイックノート（セッション中メモ）</span>
            <span className="text-coc-gold">→</span>
          </Link>
          <Link
            href={`/characters/${id}/growth`}
            className="flex items-center justify-between rounded-lg border border-coc-border bg-coc-surface px-4 py-3 text-sm text-coc-muted hover:text-coc-text hover:border-coc-border-glow transition-colors"
          >
            <span>技能成長履歴</span>
            <span className="text-coc-gold">→</span>
          </Link>
          <Link
            href={`/characters/${id}/spells`}
            className="flex items-center justify-between rounded-lg border border-coc-border bg-coc-surface px-4 py-3 text-sm text-coc-muted hover:text-coc-text hover:border-coc-border-glow transition-colors"
          >
            <span>呪文・魔術</span>
            <span className="text-coc-gold">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
