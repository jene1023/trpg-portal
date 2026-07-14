export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { supabase, isSupabaseConfigured, CharacterReaction } from "@/lib/supabase";
import { calcDamageBonus, calcBuild, calcMov } from "@/lib/coc-calc";
import StatBlock from "@/app/_components/StatBlock";
import StatusBadge from "@/app/_components/StatusBadge";
import PortraitImage from "@/app/_components/PortraitImage";
import SectionDivider from "@/app/_components/SectionDivider";
import ReactionForm from "@/app/_components/ReactionForm";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (!isSupabaseConfigured) return {};
  const { slug } = await params;
  const { data: char } = await supabase
    .from("characters")
    .select("name, occupation, catchphrase, background")
    .eq("public_slug", slug)
    .eq("is_public", true)
    .single();

  if (!char) return {};

  const title = `${char.name}${char.occupation ? ` — ${char.occupation}` : ""} | CoC Portal`;
  const description =
    char.catchphrase ??
    (char.background ? char.background.slice(0, 120) : "CoC キャラクタープロフィール");

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

const DEFAULT_PUBLIC_FIELDS = [
  "portrait_url",
  "occupation",
  "age",
  "background",
];

export default async function PublicCharacterPage({ params }: Props) {
  const { slug } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: char } = await supabase
    .from("characters")
    .select("*, character_skills(*), character_traits(*), character_spells(*)")
    .eq("public_slug", slug)
    .eq("is_public", true)
    .single();

  if (!char) notFound();

  const { data: reactions } = await supabase
    .from("character_reactions")
    .select("*")
    .eq("character_id", char.id)
    .order("created_at", { ascending: false });

  const { data: quotes } = await supabase
    .from("character_quotes")
    .select("*")
    .eq("character_id", char.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: journalEntries } = await supabase
    .from("character_journal_entries")
    .select("id, title, content, mood, session_label, entry_date, created_at")
    .eq("character_id", char.id)
    .eq("is_private", false)
    .order("entry_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(10);

  const publicFields = new Set<string>(
    (char.public_fields as string[] | null) ?? DEFAULT_PUBLIC_FIELDS
  );
  const show = (field: string) => publicFields.has(field);

  const skills = char.character_skills ?? [];
  const traits = char.character_traits ?? [];
  const spells = char.character_spells ?? [];

  const db = calcDamageBonus(char.str, char.siz);
  const build = calcBuild(char.str, char.siz);
  const mov = calcMov(char.str, char.dex, char.siz);

  const sectionClass = "rounded-lg border border-coc-border coc-card-bg p-4 space-y-4";
  const sectionTitle = "coc-section-title font-cinzel text-sm font-semibold text-coc-muted uppercase tracking-widest";

  const occupationSkills = skills.filter((s: { is_occupation: boolean }) => s.is_occupation);
  const otherSkills = skills.filter(
    (s: { is_occupation: boolean; current_value: number }) =>
      !s.is_occupation && s.current_value > 0
  );

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
          {show("portrait_url") && (
            <div className="relative aspect-[3/4] rounded-lg overflow-hidden border border-coc-border">
              <PortraitImage url={char.portrait_url} name={char.name} />
              <div className="absolute inset-0 pointer-events-none coc-portrait-vignette" />
            </div>
          )}

          <div className={sectionClass}>
            <div>
              <h1 className="font-cinzel text-xl font-bold text-coc-text leading-tight coc-name-glow">
                {char.name}
              </h1>
              <div className="flex items-center gap-2 mt-1.5">
                <StatusBadge status={char.status} />
                {show("occupation") && char.occupation && (
                  <span className="text-xs text-coc-muted">{char.occupation}</span>
                )}
              </div>
            </div>

            {show("catchphrase") && char.catchphrase && (
              <p className="font-crimson italic text-coc-gold text-sm leading-relaxed border-l-2 border-coc-gold-dim pl-3">
                &ldquo;{char.catchphrase}&rdquo;
              </p>
            )}

            <SectionDivider className="my-2" />

            <dl className="space-y-1.5 text-sm">
              {show("furigana") && char.furigana && (
                <div className="flex justify-between">
                  <dt className="text-coc-muted">ふりがな</dt>
                  <dd className="text-coc-text">{char.furigana}</dd>
                </div>
              )}
              {show("age") && char.age && (
                <div className="flex justify-between">
                  <dt className="text-coc-muted">年齢</dt>
                  <dd className="text-coc-text">{char.age}歳</dd>
                </div>
              )}
              {show("birthday") && char.birthday && (
                <div className="flex justify-between">
                  <dt className="text-coc-muted">誕生日</dt>
                  <dd className="text-coc-text">{char.birthday}</dd>
                </div>
              )}
              {show("gender") && char.gender && (
                <div className="flex justify-between">
                  <dt className="text-coc-muted">性別</dt>
                  <dd className="text-coc-text">{char.gender}</dd>
                </div>
              )}
              {show("appearance") && (char.height_cm || char.weight_kg) && (
                <div className="flex justify-between">
                  <dt className="text-coc-muted">体格</dt>
                  <dd className="text-coc-text">
                    {char.height_cm ? `${char.height_cm}cm` : ""}
                    {char.height_cm && char.weight_kg ? " / " : ""}
                    {char.weight_kg ? `${char.weight_kg}kg` : ""}
                  </dd>
                </div>
              )}
              {show("appearance") && (char.eye_color || char.hair_color) && (
                <div className="flex justify-between">
                  <dt className="text-coc-muted">外見</dt>
                  <dd className="text-coc-text text-right leading-tight">
                    {char.eye_color ? `目：${char.eye_color}` : ""}
                    {char.eye_color && char.hair_color ? " / " : ""}
                    {char.hair_color ? `髪：${char.hair_color}` : ""}
                  </dd>
                </div>
              )}
              {show("mythos_books_read") && (char.mythos_books_read ?? 0) > 0 && (
                <div className="flex justify-between">
                  <dt className="text-coc-muted">神話書読了</dt>
                  <dd className="text-coc-text">{char.mythos_books_read}冊</dd>
                </div>
              )}
              {show("player_name") && char.player_name && (
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
          {show("stats") && (
            <div className={sectionClass}>
              <h2 className={sectionTitle}>能力値</h2>
              <StatBlock character={char} />
            </div>
          )}

          {/* 派生ステータス */}
          {show("derived_stats") && (
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
          )}

          {/* 技能 */}
          {show("skills") && skills.length > 0 && (
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

          {/* 特質 */}
          {show("traits") && traits.length > 0 && (
            <div className={sectionClass}>
              <h2 className={sectionTitle}>特質・重要情報</h2>
              <div className="flex flex-col gap-2">
                {traits.map((t: { id: string; trait_type: string; content: string }) => (
                  <div key={t.id} className="rounded border border-coc-border bg-coc-surface px-3 py-2 text-sm">
                    <span className="text-xs text-coc-muted mr-2">{t.trait_type}</span>
                    <span className="text-coc-text">{t.content}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 呪文 */}
          {show("spells") && spells.length > 0 && (
            <div className={sectionClass}>
              <h2 className={sectionTitle}>呪文・魔術</h2>
              <div className="flex flex-col gap-2">
                {spells.map((sp: { id: string; spell_name: string; mp_cost: number | null; san_cost: number | null; effect: string | null }) => (
                  <div key={sp.id} className="rounded border border-purple-900/50 bg-purple-950/10 px-3 py-2 text-sm">
                    <p className="font-medium text-purple-300">{sp.spell_name}</p>
                    <div className="flex gap-3 mt-0.5 text-xs text-coc-muted">
                      {sp.mp_cost !== null && <span>MP {sp.mp_cost}</span>}
                      {sp.san_cost !== null && <span>SAN {sp.san_cost}</span>}
                    </div>
                    {sp.effect && (
                      <p className="text-xs text-coc-muted mt-1 whitespace-pre-wrap">{sp.effect}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 背景・経歴 */}
          {show("background") && char.background && (
            <div className={sectionClass}>
              <h2 className={sectionTitle}>背景・経歴</h2>
              <p className="font-crimson text-coc-text leading-relaxed whitespace-pre-wrap text-[15px]">
                {char.background}
              </p>
            </div>
          )}

          {/* 名言録 */}
          {show("quotes") && (quotes ?? []).length > 0 && (
            <div className={sectionClass}>
              <h2 className={sectionTitle}>名言録</h2>
              <div className="space-y-3">
                {(quotes ?? []).map((q: { id: string; quote_text: string; scenario_name: string | null; session_label: string | null; context: string | null }) => (
                  <div key={q.id} className="space-y-1">
                    <p className="font-crimson italic text-coc-gold text-base leading-relaxed border-l-2 border-coc-gold-dim pl-3 whitespace-pre-wrap">
                      &ldquo;{q.quote_text}&rdquo;
                    </p>
                    <div className="flex flex-wrap gap-x-3 text-xs text-coc-muted pl-3">
                      {q.scenario_name && <span>📖 {q.scenario_name}</span>}
                      {q.session_label && <span>🎲 {q.session_label}</span>}
                      {q.context && <span>— {q.context}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 手記（公開日誌） */}
          {(journalEntries ?? []).length > 0 && (
            <div className={sectionClass}>
              <h2 className={sectionTitle}>📔 手記</h2>
              <div className="space-y-4">
                {(journalEntries ?? []).map((entry: { id: string; title: string; content: string; mood: string | null; session_label: string | null; entry_date: string | null; created_at: string }) => (
                  <div key={entry.id} className="rounded border border-coc-border bg-coc-surface px-4 py-3 space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-coc-text">{entry.title}</p>
                      <div className="flex items-center gap-2 text-xs text-coc-muted">
                        {entry.entry_date && <span>{entry.entry_date}</span>}
                        {entry.session_label && <span>· {entry.session_label}</span>}
                      </div>
                    </div>
                    <p className="font-crimson text-coc-text leading-relaxed whitespace-pre-wrap text-[15px]">
                      {entry.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* リアクション */}
          <div className={sectionClass}>
            <h2 className={sectionTitle}>リアクション</h2>
            <ReactionForm
              characterId={char.id}
              initialReactions={(reactions ?? []) as CharacterReaction[]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
