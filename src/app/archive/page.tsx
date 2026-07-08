export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type ArchiveCharacter = {
  id: string;
  name: string;
  occupation: string | null;
  portrait_url: string | null;
  status: "dead" | "insane" | "retired";
  farewell_scene: string | null;
  farewell_message: string | null;
  public_slug: string | null;
  scenario_name: string | null;
};

const SECTIONS = [
  {
    status: "dead" as const,
    icon: "🕯",
    label: "死亡した探索者",
    colorClass: "text-red-400/80",
  },
  {
    status: "insane" as const,
    icon: "🌀",
    label: "発狂した探索者",
    colorClass: "text-purple-400/80",
  },
  {
    status: "retired" as const,
    icon: "🌸",
    label: "引退した探索者",
    colorClass: "text-slate-400/80",
  },
] as const;

function CharCard({ char }: { char: ArchiveCharacter }) {
  const preview = char.farewell_message
    ? char.farewell_message.slice(0, 80) +
      (char.farewell_message.length > 80 ? "…" : "")
    : null;

  return (
    <div className="rounded-lg border border-coc-border coc-card-bg p-4 flex gap-4">
      {/* サムネイル */}
      <div className="flex-shrink-0">
        {char.portrait_url ? (
          <div className="relative w-16 h-16 rounded-md overflow-hidden border border-coc-border/60">
            <Image
              src={char.portrait_url}
              alt={char.name}
              fill
              className="object-cover opacity-80"
            />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-md border border-coc-border/60 bg-coc-void flex items-center justify-center text-coc-faint text-2xl select-none">
            ✦
          </div>
        )}
      </div>

      {/* 情報 */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/characters/${char.id}`}
            className="font-cinzel text-base font-semibold text-coc-text hover:text-coc-gold transition-colors truncate"
          >
            {char.name}
          </Link>
          {char.public_slug && (
            <Link
              href={`/c/${char.public_slug}`}
              className="text-xs text-coc-gold hover:underline"
            >
              公開ページ →
            </Link>
          )}
        </div>

        {char.occupation && (
          <p className="text-xs text-coc-muted">{char.occupation}</p>
        )}

        {char.scenario_name && (
          <p className="text-xs text-coc-muted/70">最後のシナリオ: {char.scenario_name}</p>
        )}

        {preview && (
          <p className="font-crimson italic text-coc-text/70 text-sm leading-relaxed">
            &ldquo;{preview}&rdquo;
          </p>
        )}

        {char.farewell_scene && (
          <details className="group">
            <summary className="cursor-pointer text-xs text-coc-muted hover:text-coc-text transition-colors select-none list-none flex items-center gap-1">
              <span className="group-open:hidden">▶ 最後のシーンを読む</span>
              <span className="hidden group-open:inline">▼ 閉じる</span>
            </summary>
            <div className="mt-2 rounded-md border border-coc-border/50 bg-coc-void/40 p-3">
              <p className="font-crimson text-coc-text/80 text-sm leading-relaxed whitespace-pre-wrap">
                {char.farewell_scene}
              </p>
            </div>
          </details>
        )}
      </div>
    </div>
  );
}

export default async function ArchivePage() {
  let characters: ArchiveCharacter[] = [];

  if (isSupabaseConfigured) {
    const { data } = await supabase
      .from("characters")
      .select(
        "id, name, occupation, portrait_url, status, farewell_scene, farewell_message, public_slug, scenario_name"
      )
      .in("status", ["dead", "insane", "retired"])
      .order("updated_at", { ascending: false });
    if (data) characters = data as ArchiveCharacter[];
  }

  const byStatus = {
    dead: characters.filter((c) => c.status === "dead"),
    insane: characters.filter((c) => c.status === "insane"),
    retired: characters.filter((c) => c.status === "retired"),
  };

  return (
    <div className="coc-page-enter mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/characters"
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          キャラクター一覧へ
        </Link>
      </div>

      {/* ヘッダー */}
      <div className="mb-8 text-center space-y-2">
        <p className="text-coc-muted text-xs uppercase tracking-widest font-cinzel">
          Archive
        </p>
        <h1 className="font-cinzel text-2xl font-bold text-coc-text">
          探索者アーカイブ
        </h1>
        <p className="font-crimson italic text-coc-muted text-sm">
          旅を終えた者たちの記録。彼らの足跡は、永遠にここに残る。
        </p>
        <p className="text-xs text-coc-muted">
          {characters.length > 0
            ? `${characters.length}人の探索者が記録されている`
            : "まだ記録された探索者はいない"}
        </p>
      </div>

      {characters.length === 0 ? (
        <div className="rounded-lg border border-coc-border bg-coc-surface p-12 text-center">
          <span className="text-4xl text-coc-faint select-none block mb-4">✦</span>
          <p className="text-coc-muted font-crimson text-lg italic">
            まだ死亡・発狂・引退した探索者はいません。
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {SECTIONS.map(({ status, icon, label, colorClass }) => {
            const group = byStatus[status];
            if (group.length === 0) return null;
            return (
              <section key={status}>
                <h2
                  className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-widest mb-4 ${colorClass}`}
                >
                  <span>{icon}</span>
                  {label} — {group.length}人
                </h2>
                <div className="space-y-3">
                  {group.map((char) => (
                    <CharCard key={char.id} char={char} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
