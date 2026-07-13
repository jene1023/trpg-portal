import RulesSidebar from "./_components/RulesSidebar";

export default function RulesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="font-cinzel text-2xl font-bold text-coc-text mb-1">
          ルールリファレンス
        </h1>
        <p className="font-crimson text-coc-muted italic text-sm">
          CoC 7th/6th版 — セッション中に素早く引けるクイックリファレンス
        </p>
      </div>
      <div className="flex gap-6 items-start">
        <aside className="shrink-0 w-44">
          <RulesSidebar />
        </aside>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
