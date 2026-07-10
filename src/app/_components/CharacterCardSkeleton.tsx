export default function CharacterCardSkeleton() {
  return (
    <div className="coc-corner-frame rounded-lg border border-coc-border coc-card-bg overflow-hidden">
      <div className="aspect-[3/4] coc-skeleton" style={{ animationDelay: "0s" }} />
      <div className="px-3 py-3 space-y-2.5">
        <div className="h-3 w-2/3 rounded coc-skeleton" style={{ animationDelay: "0.15s" }} />
        <div className="space-y-1.5">
          <div className="h-1.5 w-full rounded-full coc-skeleton" style={{ animationDelay: "0.30s" }} />
          <div className="h-1.5 w-full rounded-full coc-skeleton" style={{ animationDelay: "0.45s" }} />
        </div>
        <div className="flex gap-1 pt-0.5">
          <div className="h-4 w-12 rounded-full coc-skeleton" style={{ animationDelay: "0.60s" }} />
          <div className="h-4 w-12 rounded-full coc-skeleton" style={{ animationDelay: "0.75s" }} />
        </div>
      </div>
    </div>
  );
}
