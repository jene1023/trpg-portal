export const dynamic = "force-static";

import { COMBAT_ACTIONS, COMBAT_ORDER } from "@/lib/rules-data";

export default function CombatPage() {
  return (
    <div className="space-y-8">
      {/* 判定ルール早見表 */}
      <section className="space-y-3">
        <h2 className="font-cinzel text-sm font-bold text-coc-gold uppercase tracking-widest">
          成功度（7版）
        </h2>
        <div className="rounded-lg border border-coc-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-coc-surface border-b border-coc-border">
                <th className="text-left px-4 py-2.5 font-cinzel text-xs text-coc-muted uppercase tracking-wider">成功度</th>
                <th className="text-left px-4 py-2.5 font-cinzel text-xs text-coc-muted uppercase tracking-wider">条件</th>
                <th className="text-left px-4 py-2.5 font-cinzel text-xs text-coc-muted uppercase tracking-wider">効果</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-coc-border/50">
              <tr className="bg-coc-raised">
                <td className="px-4 py-2.5 text-yellow-400 font-semibold">決定的成功</td>
                <td className="px-4 py-2.5 text-coc-muted text-xs font-crimson">出目 ≦ 技能値 ÷ 5</td>
                <td className="px-4 py-2.5 text-coc-muted text-xs font-crimson">攻撃でダメージ最大値、対抗判定で最優先</td>
              </tr>
              <tr className="bg-coc-raised">
                <td className="px-4 py-2.5 text-green-400 font-semibold">通常成功</td>
                <td className="px-4 py-2.5 text-coc-muted text-xs font-crimson">出目 ≦ 技能値</td>
                <td className="px-4 py-2.5 text-coc-muted text-xs font-crimson">判定成功、ダメージを与える</td>
              </tr>
              <tr className="bg-coc-raised">
                <td className="px-4 py-2.5 text-coc-muted font-semibold">失敗</td>
                <td className="px-4 py-2.5 text-coc-muted text-xs font-crimson">通常・決定的・致命的のいずれでもない</td>
                <td className="px-4 py-2.5 text-coc-muted text-xs font-crimson">攻撃が外れる</td>
              </tr>
              <tr className="bg-coc-raised">
                <td className="px-4 py-2.5 text-red-400 font-semibold">致命的失敗</td>
                <td className="px-4 py-2.5 text-coc-muted text-xs font-crimson">
                  技能値 &lt; 50 → 96〜100<br />技能値 ≧ 50 → 100
                </td>
                <td className="px-4 py-2.5 text-coc-muted text-xs font-crimson">武器落とし・自傷・転倒など</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 行動順 */}
      <section className="space-y-3">
        <h2 className="font-cinzel text-sm font-bold text-coc-gold uppercase tracking-widest">
          戦闘ラウンドの流れ
        </h2>
        <div className="space-y-2">
          {COMBAT_ORDER.map((item, i) => (
            <div
              key={item.label}
              className="flex gap-3 rounded-lg border border-coc-border bg-coc-raised p-3"
            >
              <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-coc-gold-dim border border-coc-gold/40 font-cinzel text-xs font-bold text-coc-gold">
                {i + 1}
              </span>
              <div>
                <p className="font-cinzel text-sm font-semibold text-coc-text">{item.label}</p>
                <p className="text-xs text-coc-muted font-crimson mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 戦闘アクション一覧 */}
      <section className="space-y-3">
        <h2 className="font-cinzel text-sm font-bold text-coc-gold uppercase tracking-widest">
          戦闘アクション一覧
        </h2>
        <div className="space-y-2">
          {COMBAT_ACTIONS.map((action) => (
            <div
              key={action.name}
              className="rounded-lg border border-coc-border bg-coc-raised overflow-hidden"
            >
              <div className="px-4 py-2.5 border-b border-coc-border/50 bg-coc-surface">
                <span className="font-cinzel text-sm font-semibold text-coc-text">{action.name}</span>
              </div>
              <div className="px-4 py-3 space-y-1">
                <p className="text-sm text-coc-muted font-crimson">{action.desc}</p>
                {action.notes && (
                  <p className="text-xs text-coc-faint font-crimson">※ {action.notes}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ダメージ処理 */}
      <section className="space-y-3">
        <h2 className="font-cinzel text-sm font-bold text-coc-gold uppercase tracking-widest">
          ダメージ処理
        </h2>
        <div className="rounded-lg border border-coc-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-coc-surface border-b border-coc-border">
                <th className="text-left px-4 py-2.5 font-cinzel text-xs text-coc-muted uppercase tracking-wider">状態</th>
                <th className="text-left px-4 py-2.5 font-cinzel text-xs text-coc-muted uppercase tracking-wider">HP</th>
                <th className="text-left px-4 py-2.5 font-cinzel text-xs text-coc-muted uppercase tracking-wider">効果</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-coc-border/50">
              {[
                { state: "重傷", hp: "最大HPの半分以下", effect: "重傷ロール（CON×5）に失敗すると気絶する" },
                { state: "瀕死", hp: "HP 1〜2", effect: "即座に気絶、1ラウンドごとに1ダメージ（出血）" },
                { state: "死亡", hp: "HP 0以下", effect: "キャラクター死亡" },
                { state: "気絶", hp: "—", effect: "行動不能、ラウンドごとにCON×5でロールして回復判定" },
              ].map((row) => (
                <tr key={row.state} className="bg-coc-raised hover:bg-coc-surface transition-colors">
                  <td className="px-4 py-2.5 font-cinzel text-red-400 font-semibold text-xs">{row.state}</td>
                  <td className="px-4 py-2.5 text-coc-text text-xs">{row.hp}</td>
                  <td className="px-4 py-2.5 text-coc-muted text-xs font-crimson">{row.effect}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
