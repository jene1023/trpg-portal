export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { Library } from "lucide-react";
import { supabase, isSupabaseConfigured, RandomTable } from "@/lib/supabase";
import RandomTableList from "@/app/_components/RandomTableList";

export default async function RandomTablesPage() {
  if (!isSupabaseConfigured) notFound();

  const { data: tables } = await supabase
    .from("random_tables")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          ← ホーム
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-2">
        <Library size={22} className="text-coc-gold" />
        <h1 className="font-cinzel text-xl font-bold text-coc-text">カスタムランダム表</h1>
      </div>
      <p className="text-xs text-coc-muted mb-6">
        d6〜d100に対応したKP専用のグローバルランダム表ライブラリ。キャンペーンをまたいで再利用できます。
      </p>

      <RandomTableList initialTables={(tables ?? []) as RandomTable[]} />
    </div>
  );
}
