export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import { supabase, isSupabaseConfigured, Character } from "@/lib/supabase";

export default async function HallOfFamePage() {
  let characters: Character[] = [];

  if (isSupabaseConfigured) {
    const { data } = await supabase
      .from("characters")
      .select("*")
      .in("status", ["dead", "retired"])
      .order("updated_at", { ascending: false });
    if (data) characters = data as Character[];
  }

  const dead = characters.filter((c) => c.status === "dead");
  const retired = characters.filter((c) => c.status === "retired");

  function StatusBadge({ status }: { status: Character["status"] }) {
    const label = status === "dead" ? "死亡" : "引退";
    const cls =
      status === "dead"
        ? "border-red-800/60 text-red-400"
        : "border-slate-600/60 text-slate-400";
    return (
      <span className={`rounded border px-2 py-0.5 text-xs ${cls}`}>
        {label}
      </span>
    );
  }

  function CharCard({ char }: { char: Character }) {
    const preview = char.farewell_message
      ? char.farewell_message.slice(0, 50) + (char.farewell_message.length > 50 ? "…" : "")
      : null;

    return (
      <div className="rounded-lg border border-coc-border coc-card-bg p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/characters/${char.id}`}
              className="font-cinzel text-base font-semibold text-coc-text hover:text-coc-gold transition-colors"
            >
              {char.name}
            </Link>
            <StatusBadge status={char.status} />
          </div>
        </div>

        {char.occupation && (
          <p className="text-xs text-coc-muted">{char.occupation}</p>
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
            <div className="mt-3 rounded-md border border-coc-border/50 bg-coc-void/40 p-4">
              <p className="text-xs text-coc-muted mb-2 uppercase tracking-widest">最後のシーン</p>
              <p className="font-crimson text-coc-text/80 text-sm leading-relaxed whitespace-pre-wrap">
                {char.farewell_scene}
              </p>
            </div>
          </details>
        )}

        <div className="pt-1">
          <Link
            href={`/characters/${char.id}/farewell`}
            className="text-xs text-coc-muted hover:text-coc-gold transition-colors"
          >
            最終章を編集 →
          </Link>
        </div>
      </div>
    );
  }

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
        <div className="flex items-center justify-center gap-2 text-coc-muted text-sm mb-1">
          <BookOpen size={16} />
          <span className="uppercase tracking-widest font-cinzel text-xs">Hall of Fame</span>
        </div>
        <h1 className="font-cinzel text-2xl font-bold text-coc-text">英雄の記念碑</h1>
        <p className="font-crimson italic text-coc-muted text-sm">
          この地に刻まれし探索者たちの名を、永遠に記憶せよ。
        </p>
        <p className="text-xs text-coc-muted">
          {characters.length > 0
            ? `${characters.length}人の探索者が安らかに眠る`
            : "まだ記念碑に刻まれた名前はない"}
        </p>
      </div>

      {characters.length === 0 ? (
        <div className="rounded-lg border border-coc-border bg-coc-surface p-12 text-center">
          <span className="text-4xl text-coc-faint select-none block mb-4">✦</span>
          <p className="text-coc-muted font-crimson text-lg italic">
            まだ死亡・引退した探索者はいません。
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {dead.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 text-xs font-semibold text-red-400/80 uppercase tracking-widest mb-4">
                <span>✝</span>
                死亡した探索者 — {dead.length}人
              </h2>
              <div className="space-y-4">
                {dead.map((char) => (
                  <CharCard key={char.id} char={char} />
                ))}
              </div>
            </section>
          )}

          {retired.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 text-xs font-semibold text-slate-400/80 uppercase tracking-widest mb-4">
                <span>◇</span>
                引退した探索者 — {retired.length}人
              </h2>
              <div className="space-y-4">
                {retired.map((char) => (
                  <CharCard key={char.id} char={char} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
