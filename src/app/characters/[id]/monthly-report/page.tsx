export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase, isSupabaseConfigured, SessionLog, GrowthHistory } from "@/lib/supabase";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ month?: string }>;
};

function parseMonth(monthStr: string | undefined): { year: number; month: number } {
  if (monthStr && /^\d{4}-\d{2}$/.test(monthStr)) {
    const [year, month] = monthStr.split("-").map(Number);
    return { year, month };
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

function prevMonthStr(year: number, month: number): string {
  if (month === 1) return `${year - 1}-12`;
  return `${year}-${String(month - 1).padStart(2, "0")}`;
}

function nextMonthStr(year: number, month: number): string {
  if (month === 12) return `${year + 1}-01`;
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

export default async function MonthlyReportPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { month: monthParam } = await searchParams;

  if (!isSupabaseConfigured) notFound();

  const { data: char } = await supabase
    .from("characters")
    .select("id, name")
    .eq("id", id)
    .single();

  if (!char) notFound();

  const { year, month } = parseMonth(monthParam);
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const next = nextMonthStr(year, month);
  const monthEnd = `${next.slice(0, 4)}-${next.slice(5, 7)}-01`;

  const [{ data: sessions }, { data: growthRecords }] = await Promise.all([
    supabase
      .from("sessions")
      .select("*")
      .eq("character_id", id)
      .gte("played_at", monthStart)
      .lt("played_at", monthEnd)
      .order("session_number", { ascending: true }),
    supabase
      .from("growth_history")
      .select("*")
      .eq("character_id", id)
      .gte("created_at", monthStart)
      .lt("created_at", monthEnd)
      .order("created_at", { ascending: true }),
  ]);

  const logs: SessionLog[] = sessions ?? [];
  const growths: GrowthHistory[] = growthRecords ?? [];

  const totalSanLoss = logs.reduce((sum, s) => sum + s.san_loss, 0);
  const totalHpLoss = logs.reduce((sum, s) => sum + s.hp_loss, 0);
  const sessionCount = logs.length;
  const growthCount = growths.length;

  const maxSanLoss = logs.length > 0 ? Math.max(...logs.map((l) => l.san_loss), 1) : 1;

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

      <h1 className="font-cinzel text-xl font-bold text-coc-text mb-6">
        月次活動レポート
      </h1>

      {/* 月ナビゲーション */}
      <div className="flex items-center justify-between mb-8">
        <Link
          href={`/characters/${id}/monthly-report?month=${prevMonthStr(year, month)}`}
          className="flex items-center gap-1 rounded-lg border border-coc-border px-3 py-1.5 text-sm text-coc-muted hover:text-coc-text hover:border-coc-border-glow transition-colors"
        >
          <ChevronLeft size={14} />
          前月
        </Link>
        <span className="font-cinzel text-coc-text font-semibold">
          {year}年{month}月
        </span>
        <Link
          href={`/characters/${id}/monthly-report?month=${nextMonthStr(year, month)}`}
          className="flex items-center gap-1 rounded-lg border border-coc-border px-3 py-1.5 text-sm text-coc-muted hover:text-coc-text hover:border-coc-border-glow transition-colors"
        >
          次月
          <ChevronRight size={14} />
        </Link>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {(
          [
            { label: "セッション数", value: sessionCount, unit: "回" },
            { label: "SAN喪失", value: totalSanLoss, unit: "点" },
            { label: "HP喪失", value: totalHpLoss, unit: "点" },
            { label: "技能成長", value: growthCount, unit: "回" },
          ] as { label: string; value: number; unit: string }[]
        ).map(({ label, value, unit }) => (
          <div
            key={label}
            className="rounded-lg border border-coc-border bg-coc-surface p-3 text-center"
          >
            <p className="text-xs text-coc-muted mb-1">{label}</p>
            <p className="text-2xl font-bold text-coc-text tabular-nums">
              {value}
              <span className="text-sm font-normal text-coc-muted ml-0.5">{unit}</span>
            </p>
          </div>
        ))}
      </div>

      {/* SAN喪失バーグラフ */}
      {logs.length > 0 && totalSanLoss > 0 && (
        <section className="mb-8">
          <h2 className="font-cinzel text-sm font-semibold text-coc-muted uppercase tracking-widest mb-3">
            SAN喪失推移
          </h2>
          <div className="rounded-lg border border-coc-border bg-coc-surface p-4">
            <div className="flex items-end gap-2 h-24">
              {logs.map((log) => {
                const pct =
                  log.san_loss > 0
                    ? Math.round((log.san_loss / maxSanLoss) * 100)
                    : 0;
                return (
                  <div
                    key={log.id}
                    className="flex-1 flex flex-col items-center justify-end h-full"
                  >
                    <span className="text-[10px] text-coc-muted mb-1">
                      {log.san_loss > 0 ? log.san_loss : ""}
                    </span>
                    <div className="w-full bg-coc-bg rounded-t-sm overflow-hidden flex items-end h-full">
                      <div
                        className="w-full bg-red-600 rounded-t-sm transition-all"
                        style={{ height: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-coc-muted mt-1">
                      #{log.session_number}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* セッションログ一覧 */}
      <section className="mb-8">
        <h2 className="font-cinzel text-sm font-semibold text-coc-muted uppercase tracking-widest mb-3">
          セッションログ
        </h2>
        {logs.length === 0 ? (
          <div className="rounded-lg border border-coc-border bg-coc-surface p-6 text-center text-coc-muted text-sm">
            この月のセッションログはありません。
            <br />
            <Link
              href={`/characters/${id}/sessions`}
              className="mt-3 inline-block text-coc-gold hover:underline"
            >
              セッションログを追加する →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className="rounded-lg border border-coc-border bg-coc-surface px-4 py-3"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-coc-text">
                    #{log.session_number} {log.title}
                  </span>
                  {log.played_at && (
                    <span className="text-xs text-coc-muted">
                      {log.played_at.slice(0, 10)}
                    </span>
                  )}
                </div>
                <div className="flex gap-4 text-xs">
                  {log.san_loss > 0 && (
                    <span className="text-red-400">SAN -{log.san_loss}</span>
                  )}
                  {log.hp_loss > 0 && (
                    <span className="text-orange-400">HP -{log.hp_loss}</span>
                  )}
                  {log.san_loss === 0 && log.hp_loss === 0 && (
                    <span className="text-green-500/70">損害なし</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 技能成長記録 */}
      <section>
        <h2 className="font-cinzel text-sm font-semibold text-coc-muted uppercase tracking-widest mb-3">
          技能成長
        </h2>
        {growths.length === 0 ? (
          <div className="rounded-lg border border-coc-border bg-coc-surface p-6 text-center text-coc-muted text-sm">
            この月の技能成長記録はありません。
          </div>
        ) : (
          <div className="space-y-2">
            {growths.map((g) => (
              <div
                key={g.id}
                className="rounded-lg border border-coc-border bg-coc-surface px-4 py-3 flex items-center justify-between"
              >
                <div>
                  <span className="text-sm text-coc-text font-semibold">
                    {g.skill_name}
                  </span>
                  {g.session_label && (
                    <span className="ml-2 text-xs text-coc-muted">
                      ({g.session_label})
                    </span>
                  )}
                </div>
                <span className="text-sm tabular-nums">
                  <span className="text-coc-muted">{g.old_value}</span>
                  <span className="text-coc-muted mx-1">→</span>
                  <span className="text-coc-gold font-bold">{g.new_value}</span>
                  <span className="text-green-400 text-xs ml-1">
                    +{g.new_value - g.old_value}
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
