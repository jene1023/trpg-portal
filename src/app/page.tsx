export const dynamic = "force-dynamic";

import Link from "next/link";
import { Users, BookOpen, Image, ChevronRight } from "lucide-react";
import { supabase, isSupabaseConfigured, CharacterWithSkills } from "@/lib/supabase";
import CharacterCard from "./_components/CharacterCard";

const tiles = [
  {
    href: "/characters",
    icon: Users,
    title: "キャラクター",
    desc: "探索者の記録を管理する",
    available: true,
  },
  {
    href: "/rules",
    icon: BookOpen,
    title: "ルールリファレンス",
    desc: "技能・判定・戦闘ルールを確認する",
    available: false,
  },
  {
    href: "/materials",
    icon: Image,
    title: "素材ライブラリ",
    desc: "立ち絵・背景素材を管理する",
    available: false,
  },
];

export default async function HomePage() {
  let recent: CharacterWithSkills[] | null = null;
  if (isSupabaseConfigured) {
    const { data } = await supabase
      .from("characters")
      .select("*, character_skills(*)")
      .order("updated_at", { ascending: false })
      .limit(5);
    recent = data as CharacterWithSkills[];
  }

  const configured = isSupabaseConfigured;

  return (
    <div className="coc-page-enter mx-auto max-w-5xl px-4 py-12 space-y-12">
      {/* Supabase未設定バナー */}
      {!configured && (
        <div className="rounded-lg border border-coc-gold-dim bg-coc-raised px-4 py-3 text-sm text-coc-muted">
          <span className="text-coc-gold font-medium">セットアップ未完了: </span>
          Supabase の URL と ANON KEY を{" "}
          <code className="text-coc-text bg-coc-void px-1 rounded">.env.local</code>{" "}
          に設定するとデータが保存できます。
        </div>
      )}

      {/* ヒーロー */}
      <div className="text-center space-y-3">
        <p className="text-coc-muted text-sm tracking-[0.2em] uppercase font-cinzel">
          Cthulhu Mythos TRPG
        </p>
        <h1 className="font-cinzel text-3xl sm:text-4xl font-bold text-coc-text">
          CoC Portal
        </h1>
        <div className="flex items-center justify-center gap-3 text-coc-faint text-lg">
          <span className="flex-1 border-t border-coc-border" />
          <span className="text-coc-gold select-none coc-star-twinkle">✦</span>
          <span className="flex-1 border-t border-coc-border" />
        </div>
        <p className="font-crimson text-coc-muted text-base sm:text-lg italic tracking-wide">
          <span
            className="font-crimson text-4xl sm:text-5xl text-coc-gold-dim leading-none relative -top-1 mr-1 opacity-40 select-none"
            aria-hidden="true"
          >&ldquo;</span>
          深淵をのぞき込むとき、深淵もまたのぞき込んでいる
          <span
            className="font-crimson text-4xl sm:text-5xl text-coc-gold-dim leading-none relative top-2 ml-1 opacity-40 select-none"
            aria-hidden="true"
          >&rdquo;</span>
        </p>
      </div>

      {/* タイル */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {tiles.map(({ href, icon: Icon, title, desc, available }) => (
          <Link
            key={href}
            href={href}
            className={`group relative rounded-lg border coc-card-bg p-5 space-y-3 transition-all duration-300 ease-out ${
              available
                ? "border-coc-border hover:border-coc-border-glow hover:shadow-[0_4px_18px_rgba(201,133,58,0.25)] motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-[0.98] motion-safe:active:translate-y-0 coc-tile-shimmer"
                : "border-coc-border opacity-50 pointer-events-none"
            }`}
          >
            {!available && (
              <span className="absolute top-2 right-2 rounded-full border border-coc-border px-2 py-0.5 text-xs text-coc-faint">
                準備中
              </span>
            )}
            <Icon size={24} className={available ? "text-coc-gold" : "text-coc-faint"} />
            <div>
              <p className="font-cinzel text-sm font-semibold text-coc-text">{title}</p>
              <p className="text-xs text-coc-muted mt-1 leading-relaxed">{desc}</p>
            </div>
            {available && (
              <ChevronRight
                size={16}
                className="absolute bottom-4 right-4 text-coc-faint group-hover:text-coc-gold transition-all duration-300 motion-safe:group-hover:translate-x-0.5"
              />
            )}
          </Link>
        ))}
      </div>

      {/* 最近のキャラクター */}
      {recent && recent.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="coc-section-title font-cinzel text-sm font-semibold text-coc-muted uppercase tracking-widest">
              最近のキャラクター
            </h2>
            <Link href="/characters" className="text-xs text-coc-gold hover:underline">
              すべて表示
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {recent.map((char) => (
              <CharacterCard
                key={char.id}
                character={char}
                skills={char.character_skills}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
