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
            className="rounded-md border border-coc-border bg-coc-surface p-2 text-center"
          >
            <p className="text-xs text-coc-muted mb-1">{label}</p>
            <p className="text-2xl font-bold text-coc-text leading-none">{val}</p>
            <p className="text-xs text-coc-faint mt-1">
              {half(val)} / {fifth(val)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
