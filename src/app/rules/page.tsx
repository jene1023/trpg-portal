export const dynamic = "force-static";

import Link from "next/link";
import { BookOpen, Swords, Brain, Shield, ChevronRight } from "lucide-react";

const SECTIONS = [
  {
    href: "/rules/abilities",
    icon: BookOpen,
    title: "能力値",
    desc: "STR/CON/POW/DEX/APP/SIZ/INT/EDUの説明とダメージボーナス表",
  },
  {
    href: "/rules/skills",
    icon: BookOpen,
    title: "技能一覧",
    desc: "7版・6版の全技能とデフォルト基本値。セッション中参照モード対応",
  },
  {
    href: "/rules/combat",
    icon: Swords,
    title: "戦闘",
    desc: "戦闘アクション一覧・行動順・ダメージ処理",
  },
  {
    href: "/rules/sanity",
    icon: Brain,
    title: "正気度",
    desc: "SANチェック・正気度喪失表・狂気の種類と持続時間",
  },
  {
    href: "/rules/push",
    icon: Shield,
    title: "プッシュロール",
    desc: "プッシュ可能な状況・許可されない状況・失敗時の結果例",
  },
];

export default function RulesIndexPage() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-coc-muted font-crimson leading-relaxed">
        クトゥルフ神話TRPG（CoC）の主要ルールを素早く参照できるリファレンスです。
        セッション中にブラウザを離れずにルールを確認できます。
      </p>

      <div className="space-y-2">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.href}
              href={s.href}
              className="flex items-center gap-4 rounded-lg border border-coc-border bg-coc-surface hover:bg-coc-raised hover:border-coc-gold/50 transition-colors p-4 group"
            >
              <div className="shrink-0 flex items-center justify-center w-9 h-9 rounded-md bg-coc-gold-dim border border-coc-gold/30">
                <Icon size={18} className="text-coc-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-cinzel text-sm font-semibold text-coc-text group-hover:text-coc-gold transition-colors">
                  {s.title}
                </p>
                <p className="text-xs text-coc-muted mt-0.5 font-crimson">{s.desc}</p>
              </div>
              <ChevronRight size={16} className="text-coc-muted shrink-0" />
            </Link>
          );
        })}
      </div>

      <div className="rounded-lg border border-coc-border/50 bg-coc-raised p-4 text-xs text-coc-faint font-crimson space-y-1">
        <p className="font-semibold text-coc-muted">使い方のヒント</p>
        <p>
          「技能一覧」ではURLクエリ（<code className="bg-coc-surface px-1 rounded">?skills=目星:65,図書館:45</code>）で
          キャラクターの現在技能値を横並び表示する<strong className="text-coc-muted">セッション中参照モード</strong>が使えます。
        </p>
      </div>
    </div>
  );
}
