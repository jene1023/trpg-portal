import { Clock } from "lucide-react";

const planned = [
  "判定の基本（通常・プッシュ・対抗）",
  "戦闘ルール",
  "正気度ルール",
  "技能一覧（CoC 7版）",
  "呪文・マジック",
];

export default function RulesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center space-y-8">
      <Clock size={40} className="mx-auto text-coc-muted" />
      <div className="space-y-2">
        <h1 className="font-cinzel text-2xl font-bold text-coc-text">
          ルールリファレンス
        </h1>
        <p className="font-crimson text-coc-muted italic text-lg">
          古き知識を編纂中...
        </p>
      </div>
      <div className="rounded-lg border border-coc-border bg-coc-surface p-6 text-left space-y-3 max-w-sm mx-auto">
        <p className="text-xs text-coc-muted uppercase tracking-widest font-cinzel">予定コンテンツ</p>
        <ul className="space-y-2">
          {planned.map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm text-coc-faint">
              <span className="text-coc-border">□</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
