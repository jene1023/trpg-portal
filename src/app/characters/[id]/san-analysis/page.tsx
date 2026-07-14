export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type Props = { params: Promise<{ id: string }> };

type CatMeta = {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  barColor: string;
  keywords: RegExp;
};

const CATEGORIES: CatMeta[] = [
  {
    label: "神格・旧支配者",
    keywords: /神格|クトゥルフ|旧支配者|ハスター|ニャルラトテップ|邪神|大いなる|古き|神話存在/,
    color: "text-purple-300",
    bgColor: "bg-purple-950/30",
    borderColor: "border-purple-700/60",
    barColor: "bg-purple-600",
  },
  {
    label: "クリーチャー遭遇",
    keywords: /クリーチャー|怪物|モンスター|化け物|魔物|異形|深きもの|ディープワン/,
    color: "text-red-300",
    bgColor: "bg-red-950/20",
    borderColor: "border-red-700/60",
    barColor: "bg-red-600",
  },
  {
    label: "死体・遺体",
    keywords: /死体|遺体|死骸|屍|死者|腐敗|腐乱|惨殺|損壊/,
    color: "text-orange-300",
    bgColor: "bg-orange-950/20",
    borderColor: "border-orange-700/60",
    barColor: "bg-orange-600",
  },
  {
    label: "呪文・儀式",
    keywords: /呪文|魔術|魔法|儀式|術式|詠唱|魔道|魔法陣/,
    color: "text-blue-300",
    bgColor: "bg-blue-950/20",
    borderColor: "border-blue-700/60",
    barColor: "bg-blue-600",
  },
  {
    label: "一時的狂気",
    keywords: /一時狂気|一時的狂気|錯乱|幻覚|幻聴|パニック|一時的な/,
    color: "text-yellow-300",
    bgColor: "bg-yellow-950/20",
    borderColor: "border-yellow-700/60",
    barColor: "bg-yellow-500",
  },
  {
    label: "不定の狂気",
    keywords: /不定狂気|不定の狂気|長期狂気|恐怖症|マニア/,
    color: "text-pink-300",
    bgColor: "bg-pink-950/20",
    borderColor: "border-pink-700/60",
    barColor: "bg-pink-600",
  },
];

const OTHER_META: CatMeta = {
  label: "その他",
  keywords: /.*/,
  color: "text-coc-muted",
  bgColor: "bg-coc-raised",
  borderColor: "border-coc-border",
  barColor: "bg-coc-muted/40",
};

function categorizeSummary(summary: string | null): CatMeta {
  if (!summary) return OTHER_META;
  for (const cat of CATEGORIES) {
    if (cat.keywords.test(summary)) return cat;
  }
  return OTHER_META;
}

const RANK_EMOJIS = ["🥇", "🥈", "🥉"];

export default async function SanAnalysisPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: char } = await supabase
    .from("characters")
    .select("id, name, san_current, san_max, san_start")
    .eq("id", id)
    .single();

  if (!char) notFound();

  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, san_loss, summary, created_at, session_number, title")
    .eq("character_id", id)
    .gt("san_loss", 0)
    .order("session_number", { ascending: true });

  const logs = sessions ?? [];

  // Accumulate losses per category
  const lossMap: Record<string, number> = {};
  const countMap: Record<string, number> = {};

  for (const log of logs) {
    const cat = categorizeSummary(log.summary);
    lossMap[cat.label] = (lossMap[cat.label] ?? 0) + log.san_loss;
    countMap[cat.label] = (countMap[cat.label] ?? 0) + 1;
  }

  const sorted = Object.entries(lossMap).sort(([, a], [, b]) => b - a);
  const maxLoss = sorted[0]?.[1] ?? 0;
  const totalLoss = sorted.reduce((sum, [, v]) => sum + v, 0);
  const top3 = sorted.slice(0, 3);

  const allMeta = [...CATEGORIES, OTHER_META];
  const metaByLabel: Record<string, CatMeta> = {};
  for (const m of allMeta) metaByLabel[m.label] = m;

  return (
    <div className="coc-page-enter mx-auto max-w-2xl px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/characters/${id}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          {char.name} に戻る
        </Link>
      </div>

      <div>
        <h1 className="font-cinzel text-2xl font-bold text-coc-text coc-name-glow">
          SAN喪失パターン分析
        </h1>
        <p className="text-sm text-coc-muted mt-1">{char.name} — セッション横断集計</p>
      </div>

      {logs.length === 0 ? (
        <div className="rounded-lg border border-coc-border bg-coc-surface p-8 text-center text-coc-muted text-sm">
          SAN喪失のあるセッションログが見つかりません。
          <br />
          <Link
            href={`/characters/${id}/sessions`}
            className="mt-3 inline-block text-coc-gold hover:underline"
          >
            セッションログを確認する →
          </Link>
        </div>
      ) : (
        <>
          {/* 統計サマリー */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-coc-border bg-coc-surface p-3 text-center">
              <p className="text-xs text-coc-muted mb-1">総SAN喪失</p>
              <p className="text-2xl font-bold text-red-400 tabular-nums">{totalLoss}</p>
            </div>
            <div className="rounded-lg border border-coc-border bg-coc-surface p-3 text-center">
              <p className="text-xs text-coc-muted mb-1">現在SAN</p>
              <p className="text-2xl font-bold text-coc-gold tabular-nums">{char.san_current}</p>
            </div>
            <div className="rounded-lg border border-coc-border bg-coc-surface p-3 text-center">
              <p className="text-xs text-coc-muted mb-1">記録セッション数</p>
              <p className="text-2xl font-bold text-coc-text tabular-nums">{logs.length}</p>
            </div>
          </div>

          {/* TOP3 ハイライトカード */}
          <div>
            <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest mb-3">
              精神を最も削った原因 TOP {top3.length}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {top3.map(([label, loss], i) => {
                const meta = metaByLabel[label] ?? OTHER_META;
                return (
                  <div
                    key={label}
                    className={`rounded-lg border p-4 text-center ${meta.bgColor} ${meta.borderColor}`}
                  >
                    <div className="text-xl mb-1">{RANK_EMOJIS[i]}</div>
                    <p className={`text-sm font-semibold ${meta.color} mb-1`}>{label}</p>
                    <p className="text-xl font-bold text-coc-text tabular-nums">-{loss} SAN</p>
                    <p className="text-xs text-coc-muted mt-1">
                      {totalLoss > 0 ? Math.round((loss / totalLoss) * 100) : 0}% /{" "}
                      {countMap[label]}回
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 横棒グラフ */}
          <div className="rounded-lg border border-coc-border bg-coc-surface p-4">
            <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest mb-4">
              原因別 累計SAN喪失量
            </h2>
            <svg
              viewBox={`0 0 400 ${sorted.length * 32 + 8}`}
              className="w-full"
              aria-label="原因別SAN喪失横棒グラフ"
            >
              {sorted.map(([label, loss], i) => {
                const meta = metaByLabel[label] ?? OTHER_META;
                const barW = maxLoss > 0 ? Math.round((loss / maxLoss) * 280) : 0;
                const y = i * 32 + 4;
                const colorMap: Record<string, string> = {
                  "神格・旧支配者": "#9333ea",
                  "クリーチャー遭遇": "#dc2626",
                  "死体・遺体": "#ea580c",
                  "呪文・儀式": "#2563eb",
                  "一時的狂気": "#eab308",
                  "不定の狂気": "#ec4899",
                  "その他": "#6b7280",
                };
                const fill = colorMap[label] ?? "#6b7280";
                return (
                  <g key={label}>
                    <text
                      x={108}
                      y={y + 14}
                      textAnchor="end"
                      fontSize="10"
                      className={`fill-current ${meta.color}`}
                      style={{ fill: "currentColor" }}
                      fill="#9ca3af"
                    >
                      {label}
                    </text>
                    <rect
                      x={112}
                      y={y + 4}
                      width={barW}
                      height={16}
                      rx={3}
                      fill={fill}
                      opacity={0.85}
                    />
                    <text
                      x={116 + barW}
                      y={y + 14}
                      fontSize="10"
                      fill="#9ca3af"
                    >
                      -{loss}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* セッション別詳細 */}
          <div className="rounded-lg border border-coc-border bg-coc-surface p-4">
            <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest mb-4">
              セッション別詳細
            </h2>
            <div className="space-y-2">
              {logs.map((log) => {
                const meta = categorizeSummary(log.summary);
                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 rounded-md border border-coc-border/50 bg-coc-raised/30 px-3 py-2"
                  >
                    <span className="w-8 shrink-0 text-xs text-coc-muted text-right mt-0.5">
                      #{log.session_number}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-coc-text truncate">{log.title}</p>
                      {log.summary && (
                        <p className="text-xs text-coc-muted line-clamp-2 mt-0.5">
                          {log.summary}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${meta.color} ${meta.bgColor} ${meta.borderColor}`}
                      >
                        {meta.label}
                      </span>
                      <span className="text-xs text-red-400 font-semibold tabular-nums">
                        -{log.san_loss}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
