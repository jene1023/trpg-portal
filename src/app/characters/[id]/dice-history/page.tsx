export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase, isSupabaseConfigured, DiceRoll, SuccessLevel } from "@/lib/supabase";

type Props = { params: Promise<{ id: string }> };

const LEVEL_LABEL: Record<SuccessLevel, string> = {
  critical_success: "決定的成功",
  success: "通常成功",
  failure: "失敗",
  fumble: "致命的失敗",
};

const LEVEL_STYLE: Record<SuccessLevel, { border: string; text: string; bg: string }> = {
  critical_success: { border: "border-yellow-400", text: "text-yellow-400", bg: "bg-yellow-400/5" },
  success:          { border: "border-green-500",  text: "text-green-400",  bg: "bg-green-500/5"  },
  failure:          { border: "border-coc-border",  text: "text-coc-muted",  bg: "bg-coc-raised"   },
  fumble:           { border: "border-red-600",     text: "text-red-500",    bg: "bg-red-600/5"    },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function DiceHistoryPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: char } = await supabase
    .from("characters")
    .select("id, name")
    .eq("id", id)
    .single();

  if (!char) notFound();

  const { data: rolls } = await supabase
    .from("dice_rolls")
    .select("*")
    .eq("character_id", id)
    .order("rolled_at", { ascending: false })
    .limit(50);

  const history: DiceRoll[] = rolls ?? [];

  // 日付でグループ化
  const grouped = history.reduce<Record<string, DiceRoll[]>>((acc, roll) => {
    const day = formatDate(roll.rolled_at);
    if (!acc[day]) acc[day] = [];
    acc[day].push(roll);
    return acc;
  }, {});

  const days = Object.keys(grouped);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/characters/${id}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          {char.name}
        </Link>
      </div>

      <h1 className="font-cinzel text-xl font-bold text-coc-text mb-2">
        ダイスロール履歴
      </h1>
      <p className="text-xs text-coc-muted mb-8">直近50件</p>

      {history.length === 0 ? (
        <div className="rounded-lg border border-coc-border bg-coc-surface p-8 text-center text-coc-muted text-sm">
          ダイスロールの記録がまだありません。
          <br />
          <span className="block mt-1">キャラクター詳細ページの技能セクションから判定してください。</span>
        </div>
      ) : (
        <div className="space-y-8">
          {days.map((day) => (
            <section key={day}>
              <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest mb-3 border-b border-coc-border pb-1">
                {day}
              </h2>
              <ol className="space-y-2">
                {grouped[day].map((roll) => {
                  const style = LEVEL_STYLE[roll.success_level];
                  return (
                    <li
                      key={roll.id}
                      className={`rounded-md border px-4 py-2.5 flex items-center justify-between gap-4 ${style.border} ${style.bg}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <time className="text-xs text-coc-muted shrink-0">
                          {formatTime(roll.rolled_at)}
                        </time>
                        <span className="text-sm text-coc-text truncate">
                          {roll.skill_name}
                          <span className="text-coc-muted ml-1 text-xs">
                            （{roll.skill_value}%）
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`font-cinzel text-xl font-bold ${style.text}`}>
                          {roll.roll_value}
                        </span>
                        <span className={`text-xs font-semibold ${style.text} hidden sm:block`}>
                          {LEVEL_LABEL[roll.success_level]}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
