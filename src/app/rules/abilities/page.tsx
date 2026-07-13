export const dynamic = "force-static";

import { ABILITIES, DAMAGE_BONUS_TABLE_7TH, DAMAGE_BONUS_TABLE_6TH } from "@/lib/rules-data";

export default function AbilitiesPage() {
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="font-cinzel text-sm font-bold text-coc-gold uppercase tracking-widest">
          能力値一覧
        </h2>
        <div className="rounded-lg border border-coc-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-coc-surface border-b border-coc-border">
                <th className="text-left px-4 py-2.5 font-cinzel text-xs text-coc-muted uppercase tracking-wider w-28">能力値</th>
                <th className="text-left px-4 py-2.5 font-cinzel text-xs text-coc-muted uppercase tracking-wider">説明</th>
                <th className="text-left px-4 py-2.5 font-cinzel text-xs text-coc-muted uppercase tracking-wider w-24">ロール</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-coc-border/50">
              {ABILITIES.map((a) => (
                <tr key={a.key} className="bg-coc-raised hover:bg-coc-surface transition-colors">
                  <td className="px-4 py-3 font-cinzel text-coc-gold font-semibold text-xs">{a.name}</td>
                  <td className="px-4 py-3 text-coc-muted text-xs font-crimson leading-relaxed">
                    <p>{a.desc}</p>
                    {a.derived && (
                      <p className="mt-0.5 text-coc-faint">{a.derived}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-cinzel text-coc-text text-xs">{a.roll}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-cinzel text-sm font-bold text-coc-gold uppercase tracking-widest">
          ダメージボーナス表（7版）
        </h2>
        <p className="text-xs text-coc-muted font-crimson">
          STR + SIZ の合計値でダメージボーナス（DB）とビルド値（Build）が決まる。
        </p>
        <div className="rounded-lg border border-coc-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-coc-surface border-b border-coc-border">
                <th className="text-left px-4 py-2.5 font-cinzel text-xs text-coc-muted uppercase tracking-wider">STR+SIZ</th>
                <th className="text-left px-4 py-2.5 font-cinzel text-xs text-coc-muted uppercase tracking-wider">DB</th>
                <th className="text-left px-4 py-2.5 font-cinzel text-xs text-coc-muted uppercase tracking-wider">Build</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-coc-border/50">
              {DAMAGE_BONUS_TABLE_7TH.map((row) => (
                <tr key={row.range} className="bg-coc-raised hover:bg-coc-surface transition-colors">
                  <td className="px-4 py-2.5 font-cinzel text-coc-text text-xs">{row.range}</td>
                  <td className={`px-4 py-2.5 font-semibold text-xs ${
                    row.db.startsWith("+") ? "text-red-400" :
                    row.db.startsWith("-") ? "text-blue-400" : "text-coc-muted"
                  }`}>{row.db}</td>
                  <td className={`px-4 py-2.5 font-semibold text-xs ${
                    row.build === "0" || row.build === "—" ? "text-coc-muted" :
                    Number(row.build) > 0 ? "text-red-400" : "text-blue-400"
                  }`}>{row.build}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-cinzel text-sm font-bold text-coc-gold uppercase tracking-widest">
          ダメージボーナス表（6版）
        </h2>
        <p className="text-xs text-coc-muted font-crimson">
          6版では STR + SIZ の合計でDBを決定する（Buildの概念なし）。
        </p>
        <div className="rounded-lg border border-coc-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-coc-surface border-b border-coc-border">
                <th className="text-left px-4 py-2.5 font-cinzel text-xs text-coc-muted uppercase tracking-wider">STR+SIZ</th>
                <th className="text-left px-4 py-2.5 font-cinzel text-xs text-coc-muted uppercase tracking-wider">DB</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-coc-border/50">
              {DAMAGE_BONUS_TABLE_6TH.map((row) => (
                <tr key={row.range} className="bg-coc-raised hover:bg-coc-surface transition-colors">
                  <td className="px-4 py-2.5 font-cinzel text-coc-text text-xs">{row.range}</td>
                  <td className={`px-4 py-2.5 font-semibold text-xs ${
                    row.db.startsWith("+") ? "text-red-400" :
                    row.db.startsWith("-") ? "text-blue-400" : "text-coc-muted"
                  }`}>{row.db}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-cinzel text-sm font-bold text-coc-gold uppercase tracking-widest">
          派生能力値（7版）
        </h2>
        <div className="rounded-lg border border-coc-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-coc-surface border-b border-coc-border">
                <th className="text-left px-4 py-2.5 font-cinzel text-xs text-coc-muted uppercase tracking-wider">派生値</th>
                <th className="text-left px-4 py-2.5 font-cinzel text-xs text-coc-muted uppercase tracking-wider">計算式</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-coc-border/50">
              {[
                { name: "HP（最大）", formula: "（CON + SIZ）÷ 10（端数切上）" },
                { name: "MP（最大）", formula: "POW ÷ 5（端数切上）" },
                { name: "SAN初期値", formula: "POW × 5" },
                { name: "SAN最大値", formula: "99 − クトゥルフ神話技能値" },
                { name: "幸運（Luck）", formula: "3D6 × 5" },
                { name: "職業技能ポイント", formula: "EDU × 4（職業により異なる）" },
                { name: "趣味技能ポイント", formula: "INT × 2" },
              ].map((row) => (
                <tr key={row.name} className="bg-coc-raised hover:bg-coc-surface transition-colors">
                  <td className="px-4 py-2.5 font-cinzel text-coc-gold text-xs font-semibold">{row.name}</td>
                  <td className="px-4 py-2.5 text-coc-muted text-xs font-crimson">{row.formula}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
