"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { SKILLS_7TH, SKILLS_6TH, type Edition } from "@/lib/rules-data";

export default function SkillsReferenceClient() {
  const searchParams = useSearchParams();
  const [edition, setEdition] = useState<Edition>("7th");
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("すべて");

  // セッション中参照モード: ?skills=目星:65,図書館:45 形式でキャラクター技能値を受け取る
  const sessionSkills = useMemo<Record<string, number>>(() => {
    const raw = searchParams.get("skills");
    if (!raw) return {};
    return Object.fromEntries(
      raw.split(",").flatMap((entry) => {
        const [name, val] = entry.split(":");
        const num = parseInt(val, 10);
        return name && !isNaN(num) ? [[decodeURIComponent(name.trim()), num]] : [];
      })
    );
  }, [searchParams]);

  const isSessionMode = Object.keys(sessionSkills).length > 0;

  const activeSkills = edition === "7th" ? SKILLS_7TH : SKILLS_6TH;
  const categories = useMemo(
    () => Array.from(new Set(activeSkills.map((s) => s.category))),
    [activeSkills]
  );

  const filtered = activeSkills.filter((s) => {
    const matchesQuery = s.name.includes(query);
    const matchesCategory =
      selectedCategory === "すべて" || s.category === selectedCategory;
    return matchesQuery && matchesCategory;
  });

  function handleEditionChange(ed: Edition) {
    setEdition(ed);
    setSelectedCategory("すべて");
    setQuery("");
  }

  return (
    <div className="space-y-6">
      {isSessionMode && (
        <div className="rounded-lg border border-coc-gold/40 bg-coc-gold-dim px-4 py-3 text-xs font-crimson text-coc-gold">
          <span className="font-semibold">セッション中参照モード</span> —
          キャラクター技能値 {Object.keys(sessionSkills).length} 件を表示中
        </div>
      )}

      {/* エディションタブ */}
      <div className="flex gap-1 rounded-lg border border-coc-border bg-coc-surface p-1 w-fit">
        {(["7th", "6th"] as const).map((ed) => (
          <button
            key={ed}
            onClick={() => handleEditionChange(ed)}
            className={`px-4 py-1.5 rounded-md text-sm font-cinzel font-semibold transition-colors ${
              edition === ed
                ? "bg-coc-gold-dim border border-coc-gold text-coc-gold"
                : "text-coc-muted hover:text-coc-text"
            }`}
          >
            CoC {ed}
          </button>
        ))}
      </div>

      {/* 技能ポイント早見表 */}
      <section className="space-y-2">
        <h2 className="font-cinzel text-sm font-bold text-coc-gold uppercase tracking-widest">
          技能ポイント（CoC {edition}）
        </h2>
        <div className="rounded-lg border border-coc-border overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-coc-surface border-b border-coc-border">
                <th className="text-left px-4 py-2.5 font-cinzel text-coc-muted uppercase tracking-wider">種別</th>
                <th className="text-left px-4 py-2.5 font-cinzel text-coc-muted uppercase tracking-wider">計算式</th>
                <th className="text-left px-4 py-2.5 font-cinzel text-coc-muted uppercase tracking-wider">例（EDU/INT=50）</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-coc-border/50">
              {edition === "7th" ? (
                <>
                  <tr className="bg-coc-raised">
                    <td className="px-4 py-2.5 text-coc-text font-semibold">職業技能ポイント</td>
                    <td className="px-4 py-2.5 text-coc-muted">EDU × 4（職業により変動）</td>
                    <td className="px-4 py-2.5 text-coc-muted">50 × 4 = 200</td>
                  </tr>
                  <tr className="bg-coc-raised">
                    <td className="px-4 py-2.5 text-coc-text font-semibold">趣味技能ポイント</td>
                    <td className="px-4 py-2.5 text-coc-muted">INT × 2</td>
                    <td className="px-4 py-2.5 text-coc-muted">50 × 2 = 100</td>
                  </tr>
                </>
              ) : (
                <>
                  <tr className="bg-coc-raised">
                    <td className="px-4 py-2.5 text-coc-text font-semibold">職業技能ポイント</td>
                    <td className="px-4 py-2.5 text-coc-muted">EDU × 20</td>
                    <td className="px-4 py-2.5 text-coc-muted">50 × 20 = 1000</td>
                  </tr>
                  <tr className="bg-coc-raised">
                    <td className="px-4 py-2.5 text-coc-text font-semibold">趣味技能ポイント</td>
                    <td className="px-4 py-2.5 text-coc-muted">INT × 10</td>
                    <td className="px-4 py-2.5 text-coc-muted">50 × 10 = 500</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 技能一覧 */}
      <section className="space-y-3">
        <h2 className="font-cinzel text-sm font-bold text-coc-gold uppercase tracking-widest">
          技能一覧（CoC {edition}）
        </h2>

        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-40">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-coc-muted pointer-events-none" />
            <input
              type="text"
              placeholder="技能名で検索..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-md border border-coc-border bg-coc-raised text-coc-text text-sm focus:outline-none focus:border-coc-gold placeholder:text-coc-faint"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-md border border-coc-border bg-coc-raised text-coc-text text-sm px-2 py-1.5 focus:outline-none focus:border-coc-gold"
          >
            <option value="すべて">すべてのカテゴリ</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="rounded-lg border border-coc-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-coc-surface border-b border-coc-border">
                <th className="text-left px-4 py-2.5 font-cinzel text-xs text-coc-muted uppercase tracking-wider">技能名</th>
                <th className="text-left px-4 py-2.5 font-cinzel text-xs text-coc-muted uppercase tracking-wider">カテゴリ</th>
                <th className="text-right px-4 py-2.5 font-cinzel text-xs text-coc-muted uppercase tracking-wider">基本値</th>
                {isSessionMode && (
                  <th className="text-right px-4 py-2.5 font-cinzel text-xs text-coc-muted uppercase tracking-wider">現在値</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-coc-border/50">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={isSessionMode ? 4 : 3}
                    className="px-4 py-8 text-center text-coc-faint font-crimson italic text-sm"
                  >
                    該当する技能が見つかりません
                  </td>
                </tr>
              ) : (
                filtered.map((skill) => {
                  const currentVal = sessionSkills[skill.name];
                  return (
                    <tr
                      key={skill.name}
                      className={`transition-colors ${
                        currentVal !== undefined
                          ? "bg-coc-gold-dim hover:bg-coc-surface"
                          : "bg-coc-raised hover:bg-coc-surface"
                      }`}
                    >
                      <td className="px-4 py-2.5 text-coc-text font-medium">{skill.name}</td>
                      <td className="px-4 py-2.5 text-coc-muted text-xs">{skill.category}</td>
                      <td className="px-4 py-2.5 text-right font-cinzel text-coc-gold text-xs font-semibold">
                        {skill.base}
                      </td>
                      {isSessionMode && (
                        <td className="px-4 py-2.5 text-right font-cinzel text-sm font-bold">
                          {currentVal !== undefined ? (
                            <span className="text-coc-gold">{currentVal}%</span>
                          ) : (
                            <span className="text-coc-faint">—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-coc-faint font-crimson text-right">
          全 {activeSkills.length} 技能 — フィルタ中: {filtered.length} 件
        </p>
      </section>

      {!isSessionMode && (
        <div className="rounded-lg border border-coc-border/50 bg-coc-raised p-3 text-xs text-coc-faint font-crimson">
          セッション中参照モード: URLに{" "}
          <code className="bg-coc-surface px-1 rounded">?skills=目星:65,図書館:45</code>{" "}
          を付けるとキャラクターの現在技能値を横並び表示します。
        </div>
      )}
    </div>
  );
}
