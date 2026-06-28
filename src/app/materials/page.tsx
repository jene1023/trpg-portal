import { ImageIcon, Clock } from "lucide-react";

const planned = [
  "立ち絵素材（キャラクター用）",
  "背景画像",
  "フレーム・装飾素材",
  "タグ・カテゴリ管理",
];

export default function MaterialsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center space-y-8">
      <div className="relative mx-auto w-12 h-12">
        <ImageIcon size={40} className="mx-auto text-coc-muted" />
        <Clock size={16} className="absolute -bottom-1 -right-1 text-coc-faint" />
      </div>
      <div className="space-y-2">
        <h1 className="font-cinzel text-2xl font-bold text-coc-text">
          素材ライブラリ
        </h1>
        <p className="font-crimson text-coc-muted italic text-lg">
          素材の収蔵庫を構築中...
        </p>
      </div>

      {/* フェード処理したモックグリッド */}
      <div className="relative max-w-lg mx-auto">
        <div className="grid grid-cols-4 gap-2 opacity-20 pointer-events-none">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[3/4] rounded-md bg-coc-surface border border-coc-border"
            />
          ))}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-lg border border-coc-border bg-coc-surface/90 backdrop-blur-sm p-4 space-y-2 text-sm">
            <p className="text-xs text-coc-muted uppercase tracking-widest font-cinzel">予定コンテンツ</p>
            <ul className="space-y-1.5 text-left">
              {planned.map((item) => (
                <li key={item} className="flex items-center gap-2 text-coc-faint">
                  <span className="text-coc-border">□</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
