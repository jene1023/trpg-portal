import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center space-y-6">
      <span className="text-6xl text-coc-faint select-none font-cinzel">404</span>
      <div className="space-y-2">
        <h1 className="font-cinzel text-xl font-bold text-coc-text">
          ページが見つかりません
        </h1>
        <p className="font-crimson text-coc-muted italic text-lg">
          その扉は存在しない、あるいは既に封印されている。
        </p>
      </div>
      <Link
        href="/"
        className="rounded-lg border border-coc-border px-4 py-2 text-sm text-coc-muted hover:text-coc-text hover:border-coc-border-glow transition-colors"
      >
        ポータルへ戻る
      </Link>
    </div>
  );
}
