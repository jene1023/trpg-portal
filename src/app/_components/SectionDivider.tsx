type Props = {
  className?: string;
};

export default function SectionDivider({ className = "" }: Props) {
  return (
    <div className={`flex items-center gap-2 ${className}`} aria-hidden="true">
      <span className="flex-1 border-t border-coc-border" />
      <span className="text-coc-faint text-[10px] select-none">❖</span>
      <span className="flex-1 border-t border-coc-border" />
    </div>
  );
}
