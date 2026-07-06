type ColorKey = "hp" | "mp" | "san";

const colorMap: Record<ColorKey, string> = {
  hp:  "var(--color-coc-hp)",
  mp:  "var(--color-coc-mp)",
  san: "var(--color-coc-san)",
};

const glowRgb: Record<ColorKey, string> = {
  hp:  "74, 140, 63",
  mp:  "58, 92, 140",
  san: "122, 92, 154",
};

type Props = {
  label: string;
  current: number;
  max: number;
  color: ColorKey;
  compact?: boolean;
};

export default function DerivedStatBar({ label, current, max, color, compact = false }: Props) {
  const pct = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0;
  const isLow = pct > 0 && pct <= 20;

  return (
    <div className={compact ? "space-y-0.5" : "space-y-1"}>
      <div className="flex justify-between items-center">
        <span className={`text-coc-muted ${compact ? "text-xs" : "text-xs"}`}>{label}</span>
        <span className={`tabular-nums ${compact ? "text-xs" : "text-xs"} text-coc-text`}>
          {current}/{max}
        </span>
      </div>
      <div className="w-full rounded-full overflow-hidden bg-coc-void h-1.5">
        <div className="coc-bar-enter h-full w-full">
          <div
            className={`h-full rounded-full transition-all duration-300 ${isLow ? "coc-stat-low-pulse" : ""}`}
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, rgba(${glowRgb[color]}, 0.55), ${colorMap[color]})`,
              boxShadow: pct > 0 ? `0 0 ${isLow ? 7 : 3}px rgba(${glowRgb[color]}, ${isLow ? 0.8 : 0.4})` : undefined,
            }}
          />
        </div>
      </div>
    </div>
  );
}
