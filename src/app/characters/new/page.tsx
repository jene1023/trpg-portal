"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import CharacterForm from "@/app/_components/CharacterForm";
import Link from "next/link";
import { Character } from "@/lib/supabase";

function NewCharacterContent() {
  const searchParams = useSearchParams();

  function getInt(key: string, fallback: number): number {
    const v = searchParams.get(key);
    if (!v) return fallback;
    const n = parseInt(v, 10);
    return isNaN(n) ? fallback : Math.max(1, Math.min(100, n));
  }

  const hasBuildData = searchParams.has("str") || searchParams.has("edu");

  const buildInitial: Partial<Character> | undefined = hasBuildData
    ? {
        str: getInt("str", 50),
        con: getInt("con", 50),
        pow: getInt("pow", 50),
        dex: getInt("dex", 50),
        app: getInt("app", 50),
        siz: getInt("siz", 50),
        int_stat: getInt("int_stat", 50),
        edu: getInt("edu", 50),
        occupation: searchParams.get("occupation") ?? "",
      }
    : undefined;

  return (
    <CharacterForm initialData={buildInitial as Character | undefined} />
  );
}

export default function NewCharacterPage() {
  return (
    <div>
      <div className="mx-auto max-w-3xl px-4 pt-6 flex justify-end gap-3 flex-wrap">
        <Link
          href="/build-simulator"
          className="inline-flex items-center gap-2 rounded-lg border border-coc-border px-4 py-2 text-sm font-medium text-coc-muted hover:text-coc-gold hover:border-coc-gold-dim transition-colors"
        >
          🎲 ビルドシミュで事前計画
        </Link>
        <Link
          href="/characters/new/wizard"
          className="inline-flex items-center gap-2 rounded-lg border border-coc-gold bg-coc-gold-dim px-4 py-2 text-sm font-medium text-coc-gold hover:bg-coc-raised transition-colors"
        >
          ✦ ウィザードで作成（初心者向け）
        </Link>
      </div>
      <Suspense fallback={<div className="p-8 text-center text-coc-muted">読み込み中…</div>}>
        <NewCharacterContent />
      </Suspense>
    </div>
  );
}
