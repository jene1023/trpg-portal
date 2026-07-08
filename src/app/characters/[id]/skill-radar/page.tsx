export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase, isSupabaseConfigured, type CharacterSkill } from "@/lib/supabase";

type Props = { params: Promise<{ id: string }> };

const CATEGORIES: { name: string; keywords: string[] }[] = [
  {
    name: "戦闘",
    keywords: ["格闘", "武道", "射撃", "回避", "投擲", "鎧", "こぶし", "キック", "頭突き", "組み付き", "拳銃", "ライフル", "サブマシンガン", "ショットガン", "マシンガン", "火炎放射器", "弓"],
  },
  {
    name: "探索",
    keywords: ["目星", "聴耳", "図書館", "ナビゲート", "追跡", "隠れる", "忍び歩き", "写真術", "電子工学", "コンピューター"],
  },
  {
    name: "対人",
    keywords: ["説得", "心理学", "言いくるめ", "魅惑", "威圧", "信用", "交渉", "母国語", "外国語"],
  },
  {
    name: "学術",
    keywords: ["歴史", "人類学", "考古学", "クトゥルフ神話", "医学", "薬学", "物理学", "化学", "生物学", "地質学", "天文学", "数学", "法律", "オカルト", "神秘学", "自然"],
  },
  {
    name: "技術",
    keywords: ["機械修理", "操縦", "電気修理", "応急手当", "乗馬", "水泳", "登攀", "跳躍", "変装", "鍵開け", "手さばき"],
  },
  {
    name: "芸術・製作",
    keywords: ["芸術", "製作", "演奏", "歌唱", "演技", "絵画", "彫刻", "写真", "裁縫", "料理", "建築", "大工"],
  },
];

function classifySkill(skillName: string): string {
  for (const cat of CATEGORIES) {
    if (cat.keywords.some((kw) => skillName.includes(kw))) {
      return cat.name;
    }
  }
  return "その他";
}

function computeCategoryAverages(skills: CharacterSkill[]): Record<string, number> {
  const buckets: Record<string, number[]> = {};
  for (const cat of CATEGORIES) {
    buckets[cat.name] = [];
  }
  buckets["その他"] = [];

  for (const s of skills) {
    const cat = classifySkill(s.skill_name);
    buckets[cat].push(s.current_value);
  }

  const result: Record<string, number> = {};
  for (const [cat, vals] of Object.entries(buckets)) {
    result[cat] = vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
  }
  return result;
}

// Build SVG polygon points for a radar chart
// axes: ordered category names, averages: value per category (0-100), cx/cy: center, radius: max radius
function buildRadarPoints(
  axes: string[],
  averages: Record<string, number>,
  cx: number,
  cy: number,
  radius: number,
): string {
  const n = axes.length;
  return axes
    .map((ax, i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      const val = Math.min(averages[ax] ?? 0, 100) / 100;
      const x = cx + radius * val * Math.cos(angle);
      const y = cy + radius * val * Math.sin(angle);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

function buildGridPoints(
  axes: string[],
  level: number, // 0.0–1.0
  cx: number,
  cy: number,
  radius: number,
): string {
  const n = axes.length;
  return axes
    .map((_, i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      const x = cx + radius * level * Math.cos(angle);
      const y = cy + radius * level * Math.sin(angle);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

export default async function SkillRadarPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) {
    return (
      <main className="coc-bg min-h-screen p-6 coc-page-enter">
        <div className="mx-auto max-w-2xl">
          <p className="text-coc-muted text-sm">Supabase が設定されていません。</p>
        </div>
      </main>
    );
  }

  const [charRes, skillsRes] = await Promise.all([
    supabase.from("characters").select("id, name").eq("id", id).single(),
    supabase.from("character_skills").select("*").eq("character_id", id),
  ]);

  if (charRes.error || !charRes.data) notFound();

  const char = charRes.data as { id: string; name: string };
  const skills: CharacterSkill[] = (skillsRes.data ?? []) as CharacterSkill[];

  const axisOrder = CATEGORIES.map((c) => c.name);
  const averages = computeCategoryAverages(skills);

  const cx = 200;
  const cy = 200;
  const radius = 150;
  const gridLevels = [0.25, 0.5, 0.75, 1.0];
  const n = axisOrder.length;

  // Axis label positions (slightly beyond the outer edge)
  const labelOffset = 1.22;
  const axisLabels = axisOrder.map((ax, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const x = cx + radius * labelOffset * Math.cos(angle);
    const y = cy + radius * labelOffset * Math.sin(angle);
    return { ax, x, y, avg: averages[ax] ?? 0 };
  });

  // Spoke end points
  const spokeEnds = axisOrder.map((_, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return {
      x: (cx + radius * Math.cos(angle)).toFixed(2),
      y: (cy + radius * Math.sin(angle)).toFixed(2),
    };
  });

  const sectionClass = "rounded-lg border border-coc-border coc-card-bg p-4 space-y-4";
  const sectionTitle = "coc-section-title font-cinzel text-sm font-semibold text-coc-muted uppercase tracking-widest";

  return (
    <main className="coc-bg min-h-screen p-4 sm:p-6 coc-page-enter">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href={`/characters/${id}`}
            className="text-coc-muted hover:text-coc-text transition-colors text-sm"
          >
            ← {char.name}
          </Link>
        </div>

        <div>
          <h1 className="font-cinzel text-xl font-bold text-coc-gold">スキルレーダー</h1>
          <p className="mt-1 text-xs text-coc-muted">技能カテゴリ別バランス可視化</p>
        </div>

        {/* Radar chart */}
        <div className={sectionClass}>
          <h2 className={sectionTitle}>カテゴリ平均値</h2>

          {skills.length === 0 ? (
            <p className="text-coc-muted text-sm py-8 text-center">技能データがありません。</p>
          ) : (
            <div className="flex flex-col items-center gap-6">
              <svg
                viewBox="0 0 400 400"
                className="w-full max-w-sm"
                aria-label="スキルカテゴリレーダーチャート"
              >
                {/* Grid polygons */}
                {gridLevels.map((level) => (
                  <polygon
                    key={level}
                    points={buildGridPoints(axisOrder, level, cx, cy, radius)}
                    fill="none"
                    stroke="currentColor"
                    strokeOpacity={0.15}
                    strokeWidth={1}
                    className="text-coc-border"
                  />
                ))}

                {/* Spokes */}
                {spokeEnds.map((pt, i) => (
                  <line
                    key={i}
                    x1={cx}
                    y1={cy}
                    x2={pt.x}
                    y2={pt.y}
                    stroke="currentColor"
                    strokeOpacity={0.2}
                    strokeWidth={1}
                    className="text-coc-border"
                  />
                ))}

                {/* Value polygon */}
                <polygon
                  points={buildRadarPoints(axisOrder, averages, cx, cy, radius)}
                  fill="currentColor"
                  fillOpacity={0.18}
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinejoin="round"
                  className="text-coc-gold"
                />

                {/* Value dots */}
                {axisOrder.map((ax, i) => {
                  const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
                  const val = Math.min(averages[ax] ?? 0, 100) / 100;
                  const x = cx + radius * val * Math.cos(angle);
                  const y = cy + radius * val * Math.sin(angle);
                  return (
                    <circle
                      key={ax}
                      cx={x.toFixed(2)}
                      cy={y.toFixed(2)}
                      r={3.5}
                      fill="currentColor"
                      className="text-coc-gold"
                    />
                  );
                })}

                {/* Axis labels */}
                {axisLabels.map(({ ax, x, y, avg }) => (
                  <text
                    key={ax}
                    x={x.toFixed(2)}
                    y={y.toFixed(2)}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={11}
                    fill="currentColor"
                    className="text-coc-text"
                    fontFamily="sans-serif"
                  >
                    <tspan x={x.toFixed(2)} dy="-7">{ax}</tspan>
                    <tspan x={x.toFixed(2)} dy="14" fontSize={10} fillOpacity={0.7}>{avg}</tspan>
                  </text>
                ))}
              </svg>

              {/* Legend table */}
              <div className="w-full">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-coc-border">
                      <th className="text-left py-1.5 px-2 text-coc-muted font-normal text-xs tracking-wide">カテゴリ</th>
                      <th className="text-right py-1.5 px-2 text-coc-muted font-normal text-xs tracking-wide">平均値</th>
                      <th className="text-right py-1.5 px-2 text-coc-muted font-normal text-xs tracking-wide">技能数</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...axisOrder, "その他"].map((cat) => {
                      const catSkills = skills.filter((s) => classifySkill(s.skill_name) === cat);
                      const avg = averages[cat] ?? 0;
                      return (
                        <tr key={cat} className="border-b border-coc-border/40 hover:bg-coc-surface/40 transition-colors">
                          <td className="py-2 px-2 text-coc-text">{cat}</td>
                          <td className="py-2 px-2 text-right">
                            <span className={avg >= 70 ? "text-coc-gold" : avg >= 40 ? "text-coc-text" : "text-coc-muted"}>
                              {avg > 0 ? avg : "—"}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-right text-coc-muted text-xs">{catSkills.length}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Back link */}
        <div className="text-center">
          <Link
            href={`/characters/${id}`}
            className="text-sm text-coc-muted hover:text-coc-text transition-colors"
          >
            ← キャラクター詳細に戻る
          </Link>
        </div>
      </div>
    </main>
  );
}
