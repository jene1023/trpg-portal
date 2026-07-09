export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase, isSupabaseConfigured, RandomTable, RandomTableEntry } from "@/lib/supabase";
import RandomTableDetail from "@/app/_components/RandomTableDetail";

type Props = { params: Promise<{ id: string }> };

export default async function RandomTableDetailPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: table } = await supabase
    .from("random_tables")
    .select("*")
    .eq("id", id)
    .single();

  if (!table) notFound();

  const { data: entries } = await supabase
    .from("random_table_entries")
    .select("*")
    .eq("table_id", id)
    .order("roll_min", { ascending: true });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/random-tables"
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          ランダム表一覧
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-1">
        <span className="rounded-full bg-coc-gold/20 px-3 py-0.5 text-xs font-bold text-coc-gold uppercase">
          {(table as RandomTable).dice_type}
        </span>
        <h1 className="font-cinzel text-xl font-bold text-coc-text">{(table as RandomTable).name}</h1>
      </div>
      <p className="text-xs text-coc-muted mb-6">
        出目の範囲と結果テキストを登録し、ロールボタンで結果を抽選できます。
      </p>

      <RandomTableDetail
        table={table as RandomTable}
        initialEntries={(entries ?? []) as RandomTableEntry[]}
      />
    </div>
  );
}
