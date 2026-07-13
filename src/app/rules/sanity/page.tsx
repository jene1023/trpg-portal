export const dynamic = "force-static";

import { SAN_LOSS_TABLE, MADNESS_TYPES } from "@/lib/rules-data";

export default function SanityPage() {
  const categories = Array.from(new Set(SAN_LOSS_TABLE.map((e) => e.category)));

  return (
    <div className="space-y-8">
      {/* SANチェック基本ルール */}
      <section className="space-y-3">
        <h2 className="font-cinzel text-sm font-bold text-coc-gold uppercase tracking-widest">
          SANチェックの流れ
        </h2>
        <div className="space-y-2">
          {[
            { step: "1", label: "トリガー発生", desc: "恐ろしいもの・禁断の知識に触れたとき KP が SANチェックを要求する。" },
            { step: "2", label: "ロール", desc: "現在 SAN 値を目標値として 1D100 を振る。" },
            { step: "3", label: "結果適用", desc: "出目 ≦ SAN 値 → 成功（最小喪失）。出目 ＞ SAN 値 → 失敗（より大きな喪失）。" },
            { step: "4", label: "狂気チェック", desc: "1セッションで5以上喪失 → 一時的狂気。20%以上喪失 → 不定狂気。SAN=0 → 永久狂気。" },
          ].map((item) => (
            <div key={item.step} className="flex gap-3 rounded-lg border border-coc-border bg-coc-raised p-3">
              <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-coc-gold-dim border border-coc-gold/40 font-cinzel text-xs font-bold text-coc-gold">
                {item.step}
              </span>
              <div>
                <p className="font-cinzel text-sm font-semibold text-coc-text">{item.label}</p>
                <p className="text-xs text-coc-muted font-crimson mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 正気度喪失表 */}
      <section className="space-y-3">
        <h2 className="font-cinzel text-sm font-bold text-coc-gold uppercase tracking-widest">
          正気度喪失表（代表例）
        </h2>
        <div className="space-y-4">
          {categories.map((cat) => {
            const entries = SAN_LOSS_TABLE.filter((e) => e.category === cat);
            return (
              <div key={cat}>
                <h3 className="font-cinzel text-xs text-coc-muted uppercase tracking-wider mb-2">{cat}</h3>
                <div className="rounded-lg border border-coc-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-coc-surface border-b border-coc-border">
                        <th className="text-left px-4 py-2 font-cinzel text-xs text-coc-muted uppercase tracking-wider">トリガー</th>
                        <th className="text-right px-3 py-2 font-cinzel text-xs text-coc-muted uppercase tracking-wider w-16">成功</th>
                        <th className="text-right px-4 py-2 font-cinzel text-xs text-coc-muted uppercase tracking-wider w-20">失敗</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-coc-border/50">
                      {entries.map((entry) => (
                        <tr key={entry.trigger} className="bg-coc-raised hover:bg-coc-surface transition-colors">
                          <td className="px-4 py-2.5 text-coc-text text-xs font-crimson">{entry.trigger}</td>
                          <td className="px-3 py-2.5 text-right font-cinzel text-xs text-green-400 font-semibold">{entry.success}</td>
                          <td className="px-4 py-2.5 text-right font-cinzel text-xs text-red-400 font-semibold">{entry.failure}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 狂気の種類 */}
      <section className="space-y-3">
        <h2 className="font-cinzel text-sm font-bold text-coc-gold uppercase tracking-widest">
          狂気の種類
        </h2>
        <div className="space-y-3">
          {MADNESS_TYPES.map((m) => (
            <div
              key={m.type}
              className="rounded-lg border border-coc-border overflow-hidden"
            >
              <div className="px-4 py-2.5 bg-coc-surface border-b border-coc-border">
                <span className="font-cinzel text-sm font-semibold text-coc-text">{m.type}</span>
              </div>
              <div className="px-4 py-3 space-y-1.5 bg-coc-raised">
                <div className="flex gap-2 text-xs">
                  <span className="text-coc-faint w-16 shrink-0">発動条件</span>
                  <span className="text-coc-muted font-crimson">{m.trigger}</span>
                </div>
                <div className="flex gap-2 text-xs">
                  <span className="text-coc-faint w-16 shrink-0">持続時間</span>
                  <span className="text-coc-muted font-crimson">{m.duration}</span>
                </div>
                <div className="flex gap-2 text-xs">
                  <span className="text-coc-faint w-16 shrink-0">効果</span>
                  <span className="text-coc-muted font-crimson">{m.effect}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SAN上限 */}
      <section className="space-y-3">
        <h2 className="font-cinzel text-sm font-bold text-coc-gold uppercase tracking-widest">
          SAN値の上限
        </h2>
        <div className="rounded-lg border border-coc-border bg-coc-raised p-4 text-sm font-crimson space-y-2">
          <p className="text-coc-text font-semibold">SAN最大値 = 99 − クトゥルフ神話技能値</p>
          <p className="text-coc-muted text-xs">
            クトゥルフ神話の知識を深めるほど正気の上限が下がる。
            クトゥルフ神話技能が上がると SAN の回復上限が低くなるため、長期的に正気を保つことが難しくなる。
          </p>
          <div className="mt-2 rounded border border-coc-border/50 overflow-hidden">
            <table className="w-full text-xs">
              <tbody className="divide-y divide-coc-border/40">
                {[
                  { mythos: 0, sanMax: 99 },
                  { mythos: 10, sanMax: 89 },
                  { mythos: 25, sanMax: 74 },
                  { mythos: 50, sanMax: 49 },
                  { mythos: 75, sanMax: 24 },
                ].map((row) => (
                  <tr key={row.mythos} className="bg-coc-surface">
                    <td className="px-3 py-1.5 text-coc-muted">クトゥルフ神話 {row.mythos}%</td>
                    <td className="px-3 py-1.5 text-right text-coc-gold font-semibold">SAN上限 {row.sanMax}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
