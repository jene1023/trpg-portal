import { CharacterStatus } from "@/lib/supabase";

const config: Record<
  CharacterStatus,
  { label: string; className: string }
> = {
  alive:   { label: "生存",   className: "bg-coc-alive   text-green-200" },
  dead:    { label: "死亡",   className: "bg-coc-dead    text-red-200"   },
  insane:  { label: "狂気",   className: "bg-coc-insane  text-purple-200"},
  retired: { label: "引退",   className: "bg-coc-retired text-coc-muted" },
};

type Props = {
  status: CharacterStatus;
  className?: string;
};

export default function StatusBadge({ status, className = "" }: Props) {
  const { label, className: base } = config[status];
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium leading-tight ${base} ${className}`}
    >
      {label}
    </span>
  );
}
