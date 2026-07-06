import { CharacterStatus } from "@/lib/supabase";

const config: Record<
  CharacterStatus,
  { label: string; className: string }
> = {
  alive:   { label: "生存",   className: "bg-coc-alive   text-green-200  shadow-[0_0_6px_rgba(74,140,63,0.5)]  coc-badge-alive" },
  dead:    { label: "死亡",   className: "bg-coc-dead    text-red-200    shadow-[0_0_6px_rgba(180,40,40,0.55)]  coc-badge-dead"   },
  insane:  { label: "狂気",   className: "bg-coc-insane  text-purple-200 shadow-[0_0_6px_rgba(130,50,200,0.55)] coc-badge-insane" },
  retired: { label: "引退",   className: "bg-coc-retired text-coc-muted shadow-[0_0_4px_rgba(100,85,60,0.20)] coc-badge-retired" },
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
