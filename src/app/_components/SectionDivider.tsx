type Props = {
  className?: string;
};

export default function SectionDivider({ className = "" }: Props) {
  return (
    <div className={`flex items-center gap-2 ${className}`} aria-hidden="true">
      <span className="coc-divider-l" />
      <span className="text-coc-gold-dim text-[10px] select-none coc-rune-awaken">❖</span>
      <span className="coc-divider-r" />
    </div>
  );
}
