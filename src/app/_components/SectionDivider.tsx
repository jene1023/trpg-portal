type Props = {
  className?: string;
};

export default function SectionDivider({ className = "" }: Props) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`} aria-hidden="true">
      <span className="coc-divider-l" />
      <span className="text-coc-faint text-[7px] select-none opacity-60 coc-star-twinkle" style={{ animationDelay: "1.2s" }}>✦</span>
      <span className="text-coc-gold-dim text-[10px] select-none coc-rune-awaken mx-0.5">❖</span>
      <span className="text-coc-faint text-[7px] select-none opacity-60 coc-star-twinkle" style={{ animationDelay: "2.8s" }}>✦</span>
      <span className="coc-divider-r" />
    </div>
  );
}
