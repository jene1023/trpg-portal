import { Character } from "@/lib/supabase";
import { half, fifth } from "@/lib/coc-calc";

type StatKey = {
  key: keyof Character;
  label: string;
};

const STATS: StatKey[] = [
  { key: "str",      label: "STR" },
  { key: "con",      label: "CON" },
  { key: "pow",      label: "POW" },
  { key: "dex",      label: "DEX" },
  { key: "app",      label: "APP" },
  { key: "siz",      label: "SIZ" },
  { key: "int_stat", label: "INT" },
  { key: "edu",      label: "EDU" },
];

type Props = { character: Character };

export default function StatBlock({ character }: Props) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {STATS.map(({ key, label }) => {
        const val = character[key] as number;
        return (
          <div
            key={key}
            className="group rounded-md border border-coc-border bg-coc-surface p-2 text-center transition-colors duration-200 hover:border-coc-border-glow hover:bg-coc-raised"
          >
            <p className="text-xs text-coc-muted mb-1 tracking-wide group-hover:text-coc-gold transition-colors duration-200">
              {label}
            </p>
            <p className="text-2xl font-bold text-coc-text leading-none">{val}</p>
            <div className="mt-1.5 pt-1 border-t border-coc-border/60">
              <p className="text-xs text-coc-faint tabular-nums">
                {half(val)} / {fifth(val)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
