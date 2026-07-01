export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { calcDamageBonus, calcBuild, calcMov } from "@/lib/coc-calc";
import StatBlock from "@/app/_components/StatBlock";
import StatusBadge from "@/app/_components/StatusBadge";
import PortraitImage from "@/app/_components/PortraitImage";
import SectionDivider from "@/app/_components/SectionDivider";

type Props = { params: Promise<{ slug: string }> };

export default async function PublicProfilePage({ params }: Props) {
  const { slug } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: char } = await supabase
    .from("characters")
    .select("*, character_skills(*)")
    .eq("public_slug", slug)
    .eq("is_public", true)
    .single();

  if (!char) notFound();

  const { character_skills: skills } = char;

  const db = calcDamageBonus(char.str, char.siz);
  const build = calcBuild(char.str, char.siz);
  const mov = calcMov(char.str, char.dex, char.siz);

  const sectionClass = "rounded-lg border border-coc-border coc-card-bg p-4 space-y-4";
  const sectionTitle = "coc-section-title font-cinzel text-sm font-semibold text-coc-muted uppercase tracking-widest";

  const occupationSkills = (skills ?? []).filter((s: { is_occupation: boolean }) => s.is_occupation);
  const otherSkills = (skills ?? []).filter((s: { is_occupation: boolean; current_value: number }) => !s.is_occupation && s.current_value > 0);

  return (
    <div className="coc-page-enter mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center gap-2">
        <span className="rounded-full border border-green-700 bg-green-950/30 px-2.5 py-0.5 text-xs text-green-400">
          公開プロフィール
        </span>
        <span className="text-xs text-coc-muted">このページはリンクを知っている全員が閲覧できます</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
        {/* 左カラム */}
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

            <SectionDivider className="my-2" />

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
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "HP", current: char.hp_current, max: char.hp_max },
                { label: "MP", current: char.mp_current, max: char.mp_max },
                { label: "SAN", current: char.san_current, max: char.san_max },
              ].map(({ label, current, max }) => (
                <div key={label} className="rounded-md border border-coc-border bg-coc-surface p-3 text-center">
                  <p className="text-xs text-coc-muted mb-1">{label}</p>
                  <p className="text-2xl font-bold text-coc-text tabular-nums">{current}</p>
                  <p className="text-xs text-coc-faint">/{max}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2">
              {[
                { label: "幸運", value: char.luck },
                { label: "ダメージボーナス", value: db },
                { label: "ビルド", value: build },
                { label: "移動力", value: mov },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-md border border-coc-border bg-coc-surface p-2 text-center">
                  <p className="text-xs text-coc-muted">{label}</p>
                  <p className="text-lg font-bold text-coc-text tabular-nums">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 技能 */}
          {(skills ?? []).length > 0 && (
            <div className={sectionClass}>
              <h2 className={sectionTitle}>技能</h2>
              {occupationSkills.length > 0 && (
                <div>
                  <p className="text-xs text-coc-muted font-semibold mb-2">職業技能</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {occupationSkills.map((s: { id: string; skill_name: string; current_value: number }) => (
                      <div key={s.id} className="rounded border border-coc-gold/30 bg-coc-gold/5 px-2 py-1.5 text-sm">
                        <span className="text-coc-text">{s.skill_name}</span>
                        <span className="ml-auto float-right font-bold text-coc-gold tabular-nums">{s.current_value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {otherSkills.length > 0 && (
                <div>
                  <p className="text-xs text-coc-muted font-semibold mb-2">その他の技能</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {otherSkills.map((s: { id: string; skill_name: string; current_value: number }) => (
                      <div key={s.id} className="rounded border border-coc-border bg-coc-surface px-2 py-1.5 text-sm">
                        <span className="text-coc-muted">{s.skill_name}</span>
                        <span className="ml-auto float-right font-bold text-coc-text tabular-nums">{s.current_value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 背景・メモ */}
          {char.background && (
            <div className={sectionClass}>
              <h2 className={sectionTitle}>背景・経歴</h2>
              <p className="font-crimson text-coc-text leading-relaxed whitespace-pre-wrap text-[15px]">
                {char.background}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
