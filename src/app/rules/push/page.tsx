export const dynamic = "force-static";

import { PUSH_CONDITIONS, PUSH_FAILURE_EXAMPLES } from "@/lib/rules-data";

export default function PushPage() {
  return (
    <div className="space-y-8">
      {/* プッシュロールとは */}
      <section className="space-y-3">
        <h2 className="font-cinzel text-sm font-bold text-coc-gold uppercase tracking-widest">
          プッシュロールとは
        </h2>
        <div className="rounded-lg border border-coc-border bg-coc-raised p-4 text-sm font-crimson space-y-2">
          <p className="text-coc-text font-semibold">通常判定に失敗したとき、もう一度だけ同じ判定を行える。</p>
          <ul className="list-disc list-inside space-y-1 text-xs text-coc-muted">
            <li>KP の許可が必要</li>
            <li>プッシュして失敗した場合は元の失敗より深刻な結果が発生する</li>
            <li>致命的失敗（ファンブル）が出た場合はプッシュ不可</li>
            <li>クトゥルフ神話など、すでに失敗が確定している技能はプッシュ不可</li>
            <li>プッシュで致命的失敗が出た場合は最悪の結果をもたらす</li>
          </ul>
        </div>
      </section>

      {/* プッシュ条件一覧 */}
      <section className="space-y-3">
        <h2 className="font-cinzel text-sm font-bold text-coc-gold uppercase tracking-widest">
          プッシュ可否の例
        </h2>
        <div className="space-y-3">
          {PUSH_CONDITIONS.map((cond) => (
            <div
              key={cond.skill}
              className="rounded-lg border border-coc-border overflow-hidden"
            >
              <div className="px-4 py-2.5 bg-coc-surface border-b border-coc-border flex items-center justify-between">
                <span className="font-cinzel text-sm font-semibold text-coc-text">{cond.skill}</span>
                <span className="text-xs text-coc-faint">{cond.category}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-coc-border/50 bg-coc-raised">
                <div className="px-4 py-3 space-y-1">
                  <p className="text-xs font-semibold text-green-400">許可される状況</p>
                  <p className="text-xs text-coc-muted font-crimson">{cond.allowed}</p>
                </div>
                <div className="px-4 py-3 space-y-1">
                  <p className="text-xs font-semibold text-red-400">許可されない状況</p>
                  <p className="text-xs text-coc-muted font-crimson">{cond.notAllowed}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* プッシュ失敗の結果例 */}
      <section className="space-y-3">
        <h2 className="font-cinzel text-sm font-bold text-coc-gold uppercase tracking-widest">
          プッシュ失敗時の結果例
        </h2>
        <div className="rounded-lg border border-coc-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-coc-surface border-b border-coc-border">
                <th className="text-left px-4 py-2.5 font-cinzel text-xs text-coc-muted uppercase tracking-wider w-32">技能</th>
                <th className="text-left px-4 py-2.5 font-cinzel text-xs text-coc-muted uppercase tracking-wider">失敗の結果例</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-coc-border/50">
              {PUSH_FAILURE_EXAMPLES.map((ex) => (
                <tr key={ex.skill} className="bg-coc-raised hover:bg-coc-surface transition-colors">
                  <td className="px-4 py-2.5 font-cinzel text-coc-gold font-semibold text-xs">{ex.skill}</td>
                  <td className="px-4 py-2.5 text-coc-muted text-xs font-crimson">{ex.consequence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-coc-faint font-crimson">
          ※ 具体的な結果はKPが状況に応じて判断する。上記はあくまでも代表例。
        </p>
      </section>
    </div>
  );
}
